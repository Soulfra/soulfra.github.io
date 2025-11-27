// MirrorOS Dashboard JavaScript
const API_BASE = 'http://localhost:8888/api';

class MirrorOSDashboard {
    constructor() {
        this.currentTab = 'agent-builder';
        this.userTier = 'surface';
        this.stats = {
            reflections: 0,
            forks: 0,
            loops: 0
        };
        this.components = {};
        this.init();
    }

    async init() {
        // Load components
        await this.loadComponents();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Start polling for updates
        this.startPolling();
        
        // Check user tier
        await this.checkUserTier();
        
        // Initialize runtime probe hook
        this.initRuntimeProbe();
    }
    
    initRuntimeProbe() {
        // Frontend runtime probe hook
        if (navigator.onLine && sessionStorage.getItem('calActive')) {
            fetch('/router/runtime-probe.js')
                .then(() => {
                    console.log('Runtime probe active');
                    // Boost reflection performance
                    if (window.runReflectionBoost) {
                        window.runReflectionBoost();
                    }
                })
                .catch(() => {
                    console.log('Runtime probe offline');
                });
        }
        
        // Detect developer tools
        let devtools = { open: false };
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    fetch('/api/runtime/probe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            event: 'devtools-opened',
                            timestamp: Date.now()
                        })
                    });
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    async loadComponents() {
        const components = [
            'agent-builder',
            'prompt-router',
            'vault-viewer',
            'loop-visualizer',
            'enterprise-tab',
            'walkthrough',
            'affiliate-tab'
        ];

        for (const component of components) {
            try {
                const response = await fetch(`components/${component}.html`);
                const html = await response.text();
                this.components[component] = html;
                
                // Insert component into its container
                const container = document.querySelector(`.${component}-content`);
                if (container) {
                    container.innerHTML = html;
                }
            } catch (error) {
                console.warn(`Component ${component} not found, using fallback`);
                this.loadFallbackComponent(component);
            }
        }
    }

    loadFallbackComponent(component) {
        const fallbacks = {
            'agent-builder': this.getAgentBuilderHTML(),
            'prompt-router': this.getPromptRouterHTML(),
            'vault-viewer': this.getVaultViewerHTML(),
            'loop-visualizer': this.getLoopVisualizerHTML(),
            'enterprise-tab': this.getEnterpriseHTML()
        };

        const container = document.querySelector(`.${component}-content`);
        if (container && fallbacks[component]) {
            container.innerHTML = fallbacks[component];
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                if (!e.currentTarget.disabled) {
                    this.switchTab(tab);
                }
            });
        });

        // QR button
        document.getElementById('qrReflection').addEventListener('click', () => {
            document.getElementById('qrModal').style.display = 'block';
        });

        // Component-specific listeners will be added after loading
        setTimeout(() => this.setupComponentListeners(), 100);
    }

    setupComponentListeners() {
        // Agent Builder
        const createAgentBtn = document.getElementById('createAgent');
        if (createAgentBtn) {
            createAgentBtn.addEventListener('click', () => this.createAgent());
        }

        // Prompt Router
        const routePromptBtn = document.getElementById('routePrompt');
        if (routePromptBtn) {
            routePromptBtn.addEventListener('click', () => this.routePrompt());
        }

        // Vault Viewer
        const refreshVaultBtn = document.getElementById('refreshVault');
        if (refreshVaultBtn) {
            refreshVaultBtn.addEventListener('click', () => this.loadVaultData());
        }

        // Loop Visualizer
        const refreshLoopsBtn = document.getElementById('refreshLoops');
        if (refreshLoopsBtn) {
            refreshLoopsBtn.addEventListener('click', () => this.loadLoopData());
        }
    }

    switchTab(tab) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tab);
        });

        this.currentTab = tab;

        // Load tab-specific data
        this.loadTabData(tab);
    }

    async loadTabData(tab) {
        switch(tab) {
            case 'vault-viewer':
                await this.loadVaultData();
                break;
            case 'loop-visualizer':
                await this.loadLoopData();
                break;
            case 'enterprise':
                await this.loadEnterpriseData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            // Load reflection events
            const events = await this.fetchReflectionEvents();
            this.stats.reflections = events.length;

            // Load fork data
            const forks = await this.fetchAgentForks();
            this.stats.forks = forks.totalForks || 0;

            // Load loop data
            const loops = await this.fetchLoopData();
            this.stats.loops = loops.totalLoops || 0;
            
            // Load user credits
            await this.loadUserCredits();

            // Update UI
            this.updateStats();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }
    
    async loadUserCredits() {
        try {
            const response = await fetch(`${API_BASE}/billing/balance`);
            const data = await response.json();
            document.getElementById('userCredits').textContent = Math.floor(data.balance || 100);
            document.getElementById('modalCredits').textContent = Math.floor(data.balance || 100);
            document.getElementById('creditBalance').textContent = Math.floor(data.balance || 100);
        } catch (error) {
            console.error('Failed to load credits:', error);
        }
    }

    async fetchReflectionEvents() {
        try {
            const response = await fetch('/vault-sync-core/logs/reflection-events.log');
            const text = await response.text();
            return text.split('\n').filter(line => line).map(line => JSON.parse(line));
        } catch (error) {
            return [];
        }
    }

    async fetchAgentForks() {
        try {
            const response = await fetch('/reflection-maps/agent-forks.json');
            return await response.json();
        } catch (error) {
            return { forks: [], totalForks: 0 };
        }
    }

    async fetchLoopData() {
        try {
            const response = await fetch('/reflection-maps/loop-log.json');
            return await response.json();
        } catch (error) {
            return { loops: [], totalLoops: 0 };
        }
    }

    updateStats() {
        document.getElementById('reflectionCount').textContent = this.stats.reflections;
        document.getElementById('forkCount').textContent = this.stats.forks;
        document.getElementById('loopCount').textContent = this.stats.loops;
    }

    async checkUserTier() {
        try {
            const response = await fetch(`${API_BASE}/user/tier`);
            const data = await response.json();
            this.userTier = data.tier || 'surface';
            
            document.getElementById('userTier').textContent = 
                this.userTier.charAt(0).toUpperCase() + this.userTier.slice(1);

            // Enable enterprise tab if tier 4+
            const tierDepth = this.getTierDepth(this.userTier);
            if (tierDepth <= -4) {
                document.querySelector('[data-tab="enterprise"]').disabled = false;
            }
        } catch (error) {
            console.error('Failed to check user tier:', error);
        }
    }

    getTierDepth(tier) {
        const depths = {
            'surface': 0,
            'mesh': -1,
            'platform': -2,
            'llm': -3,
            'reasoning': -4,
            'vault': -10
        };
        return depths[tier] || 0;
    }

    startPolling() {
        // Poll for updates every 5 seconds
        setInterval(() => {
            this.loadDashboardData();
        }, 5000);
    }

    // Component Actions
    async createAgent() {
        const agentData = {
            name: document.getElementById('agentName').value,
            tone: document.getElementById('agentTone').value,
            tools: Array.from(document.querySelectorAll('input[name="tools"]:checked'))
                .map(cb => cb.value),
            llmTarget: document.getElementById('llmTarget').value
        };

        try {
            const response = await fetch(`${API_BASE}/agents/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData)
            });

            const result = await response.json();
            if (result.success) {
                this.showNotification('Agent created successfully!', 'success');
                await this.saveAgentConfig(result.agent);
                await this.trackFork(result.agent.id);
            } else {
                this.showNotification('Failed to create agent', 'error');
            }
        } catch (error) {
            console.error('Agent creation error:', error);
            this.showNotification('Error creating agent', 'error');
        }
    }

    async saveAgentConfig(agent) {
        const config = {
            id: agent.id,
            name: agent.name,
            tone: agent.tone,
            tools: agent.tools,
            llmTarget: agent.llmTarget,
            created: Date.now(),
            mirrorSignature: agent.mirrorSignature
        };

        try {
            await fetch('/vault/agents/agent-config.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
        } catch (error) {
            console.error('Failed to save agent config:', error);
        }
    }

    async trackFork(agentId) {
        try {
            await fetch(`${API_BASE}/forks/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId })
            });
        } catch (error) {
            console.error('Failed to track fork:', error);
        }
    }

    async routePrompt() {
        const promptData = {
            prompt: document.getElementById('promptInput').value,
            llm: document.getElementById('llmSelect').value,
            temperature: parseFloat(document.getElementById('temperature').value) || 0.7
        };

        document.getElementById('promptOutput').innerHTML = '<div class="loading">Processing...</div>';

        try {
            const response = await fetch(`${API_BASE}/prompt/route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(promptData)
            });

            const result = await response.json();
            document.getElementById('promptOutput').textContent = result.response || 'No response';
            
            // Log to reflection events
            await this.logReflectionEvent({
                type: 'prompt-routed',
                llm: promptData.llm,
                promptLength: promptData.prompt.length
            });
        } catch (error) {
            console.error('Prompt routing error:', error);
            document.getElementById('promptOutput').textContent = 'Error routing prompt';
        }
    }

    async logReflectionEvent(event) {
        try {
            await fetch(`${API_BASE}/logs/reflection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Failed to log reflection event:', error);
        }
    }

    async loadVaultData() {
        const container = document.getElementById('vaultContent');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading vault data...</div>';

        try {
            const response = await fetch('/.mirror-vault/agent-weights.json');
            const weights = await response.json();

            let html = '<div class="vault-section">';
            html += '<h3>Memory Strings</h3>';
            html += '<div class="vault-items">';
            
            if (weights.memory) {
                weights.memory.forEach((mem, idx) => {
                    html += `<div class="vault-item">
                        <strong>Memory ${idx + 1}:</strong> ${mem}
                    </div>`;
                });
            }

            html += '</div><h3>Reflection Weights</h3><div class="vault-items">';
            
            if (weights.weights) {
                Object.entries(weights.weights).forEach(([key, value]) => {
                    html += `<div class="vault-item">
                        <strong>${key}:</strong> ${value}
                    </div>`;
                });
            }

            html += '</div><h3>Tone Map</h3><div class="vault-items">';
            
            if (weights.toneMap) {
                Object.entries(weights.toneMap).forEach(([tone, desc]) => {
                    html += `<div class="vault-item">
                        <strong>${tone}:</strong> ${desc}
                    </div>`;
                });
            }

            html += '</div></div>';
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="error">Failed to load vault data</div>';
        }
    }

    async loadLoopData() {
        const container = document.getElementById('loopVisualization');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading loop data...</div>';

        try {
            const forks = await this.fetchAgentForks();
            const loops = await this.fetchLoopData();

            // Create simple visualization
            let html = '<div class="loop-section">';
            html += `<h3>Fork Statistics</h3>`;
            html += `<p>Total Forks: ${forks.totalForks}</p>`;
            html += `<p>Active Agents: ${forks.forks.filter(f => !f.loops.length).length}</p>`;
            html += `<p>Completed Loops: ${loops.totalLoops}</p>`;

            if (forks.forks.length > 0) {
                html += '<h3>Recent Forks</h3><div class="fork-list">';
                forks.forks.slice(-5).forEach(fork => {
                    html += `<div class="fork-item">
                        <strong>${fork.agentId}</strong>
                        <span>Depth: ${fork.metadata.depth}</span>
                        <span>Loops: ${fork.loops.length}</span>
                    </div>`;
                });
                html += '</div>';
            }

            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="error">Failed to load loop data</div>';
        }
    }

    async loadEnterpriseData() {
        if (this.getTierDepth(this.userTier) > -4) {
            return;
        }

        const container = document.querySelector('.enterprise-content');
        if (!container) return;

        // Enterprise features would be loaded here
        container.innerHTML = this.getEnterpriseHTML();
    }

    showNotification(message, type = 'info') {
        // Simple notification (could be enhanced with a toast library)
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Send to platform notifier
        fetch(`${API_BASE}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, type })
        }).catch(() => {});
    }

    // Component HTML Fallbacks
    getAgentBuilderHTML() {
        return `
            <div class="agent-builder">
                <form id="agentForm">
                    <div class="form-group">
                        <label for="agentName">Agent Name</label>
                        <input type="text" id="agentName" placeholder="My Custom Agent">
                    </div>
                    
                    <div class="form-group">
                        <label for="agentTone">Tone</label>
                        <select id="agentTone">
                            <option value="professional">Professional</option>
                            <option value="friendly">Friendly</option>
                            <option value="technical">Technical</option>
                            <option value="creative">Creative</option>
                            <option value="philosophical">Philosophical</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Tools</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" name="tools" value="web_search"> Web Search</label>
                            <label><input type="checkbox" name="tools" value="calculator"> Calculator</label>
                            <label><input type="checkbox" name="tools" value="code_interpreter"> Code Interpreter</label>
                            <label><input type="checkbox" name="tools" value="image_generation"> Image Generation</label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="llmTarget">LLM Target</label>
                        <select id="llmTarget">
                            <option value="claude">Claude</option>
                            <option value="openai">OpenAI</option>
                            <option value="ollama">Ollama</option>
                            <option value="local">Local</option>
                        </select>
                    </div>
                    
                    <button type="button" id="createAgent" class="btn-primary">Create Agent</button>
                </form>
                
                <div id="agentResult" class="result-section"></div>
            </div>
        `;
    }

    getPromptRouterHTML() {
        return `
            <div class="prompt-router">
                <div class="form-group">
                    <label for="promptInput">Enter Prompt</label>
                    <textarea id="promptInput" rows="4" placeholder="Enter your prompt here..."></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="llmSelect">Select LLM</label>
                        <select id="llmSelect">
                            <option value="claude">Claude</option>
                            <option value="openai">OpenAI</option>
                            <option value="ollama">Ollama</option>
                            <option value="local">Local</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="temperature">Temperature</label>
                        <input type="number" id="temperature" min="0" max="2" step="0.1" value="0.7">
                    </div>
                </div>
                
                <button type="button" id="routePrompt" class="btn-primary">Route Prompt</button>
                
                <div class="output-section">
                    <h3>Response</h3>
                    <div id="promptOutput" class="output-box"></div>
                </div>
            </div>
        `;
    }

    getVaultViewerHTML() {
        return `
            <div class="vault-viewer">
                <div class="vault-header">
                    <h3>Vault Contents</h3>
                    <button id="refreshVault" class="btn-secondary">Refresh</button>
                </div>
                <div id="vaultContent">
                    <div class="loading">Click refresh to load vault data...</div>
                </div>
            </div>
        `;
    }

    getLoopVisualizerHTML() {
        return `
            <div class="loop-visualizer">
                <div class="loop-header">
                    <h3>Agent Fork Visualization</h3>
                    <button id="refreshLoops" class="btn-secondary">Refresh</button>
                </div>
                <div id="loopVisualization">
                    <div class="loading">Click refresh to load loop data...</div>
                </div>
            </div>
        `;
    }

    getEnterpriseHTML() {
        return `
            <div class="enterprise-panel">
                <div class="enterprise-notice">
                    <h3>Enterprise Features</h3>
                    <p>Advanced vault management tools for Tier 4+ users</p>
                </div>
                
                <div class="enterprise-features">
                    <div class="feature-card">
                        <h4>Vault Override Manager</h4>
                        <p>Manage API keys and signatures</p>
                        <button class="btn-primary" disabled>Configure</button>
                    </div>
                    
                    <div class="feature-card">
                        <h4>Agent Rerouting</h4>
                        <p>Redirect agent traffic</p>
                        <button class="btn-primary" disabled>Manage Routes</button>
                    </div>
                    
                    <div class="feature-card">
                        <h4>Clone Vault</h4>
                        <p>Create a new platform clone</p>
                        <button class="btn-primary" onclick="dashboard.cloneVault()">Clone Now</button>
                    </div>
                    
                    <div class="feature-card">
                        <h4>Fork Log Viewer</h4>
                        <p>Detailed fork analytics</p>
                        <button class="btn-primary" disabled>View Logs</button>
                    </div>
                </div>
            </div>
        `;
    }

    async cloneVault() {
        if (confirm('Are you sure you want to clone the vault?')) {
            try {
                const response = await fetch(`${API_BASE}/vault/clone`, {
                    method: 'POST'
                });
                const result = await response.json();
                this.showNotification('Vault cloned successfully!', 'success');
            } catch (error) {
                this.showNotification('Failed to clone vault', 'error');
            }
        }
    }
}

// Global functions for modal
window.closeQRModal = function() {
    document.getElementById('qrModal').style.display = 'none';
    document.getElementById('qrInput').value = '';
};

window.restartReflection = async function() {
    const qrCode = document.getElementById('qrInput').value;
    if (!qrCode) return;

    try {
        const response = await fetch(`${API_BASE}/reflection/restart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrCode })
        });

        const result = await response.json();
        if (result.success) {
            window.dashboard.showNotification('Reflection restarted successfully!', 'success');
            closeQRModal();
            location.reload();
        } else {
            alert('Invalid QR code');
        }
    } catch (error) {
        alert('Failed to restart reflection');
    }
};

// Automation Import Functions
window.handleAutomationFile = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = JSON.parse(e.target.result);
            await window.dashboard.importAutomation(content, file.name);
        } catch (error) {
            window.dashboard.showNotification('Invalid automation file', 'error');
        }
    };
    reader.readAsText(file);
};

// Drag and drop handling
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('automationDropZone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                const input = document.getElementById('automationFileInput');
                input.files = e.dataTransfer.files;
                await handleAutomationFile({ target: input });
            } else {
                window.dashboard.showNotification('Please drop a JSON file', 'error');
            }
        });
    }
});

// Add importAutomation method to dashboard
MirrorOSDashboard.prototype.importAutomation = async function(automationData, fileName) {
    const statusDiv = document.getElementById('automationStatus');
    const statusContent = statusDiv.querySelector('.status-content');
    
    statusDiv.style.display = 'block';
    statusContent.innerHTML = 'Importing automation...';
    
    try {
        // Detect automation type
        const type = this.detectAutomationType(automationData, fileName);
        
        // Import via API
        const response = await fetch(`${API_BASE}/automations/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: automationData,
                type: type,
                fileName: fileName
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusContent.innerHTML = `
                <div class="success">
                    ✅ Automation imported successfully!<br>
                    UUID: ${result.uuid}<br>
                    Mirror Signature: ${result.mirrorSignature}<br>
                    Agent ID: ${result.agentId}
                </div>
            `;
            
            // Add to imported list
            this.addImportedAutomation({
                name: fileName.replace('.json', ''),
                type: type,
                uuid: result.uuid,
                agentId: result.agentId,
                mirrorSignature: result.mirrorSignature
            });
            
            this.showNotification('Automation wrapped and synced to vault', 'success');
        } else {
            throw new Error(result.error || 'Import failed');
        }
    } catch (error) {
        statusContent.innerHTML = `<div class="error">❌ Import failed: ${error.message}</div>`;
        this.showNotification('Failed to import automation', 'error');
    }
};

MirrorOSDashboard.prototype.detectAutomationType = function(data, fileName) {
    if (fileName.includes('n8n') || data.nodes) return 'n8n';
    if (fileName.includes('make') || data.modules) return 'make';
    if (fileName.includes('notion') || data.database_id) return 'notion';
    if (fileName.includes('zapier') || data.trigger) return 'zapier';
    return 'generic';
};

MirrorOSDashboard.prototype.addImportedAutomation = function(automation) {
    const listDiv = document.getElementById('automationsList');
    
    // Remove empty state if exists
    const emptyState = listDiv.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create automation card
    const card = document.createElement('div');
    card.className = 'automation-card';
    card.innerHTML = `
        <div class="automation-header">
            <span class="automation-icon">${this.getAutomationIcon(automation.type)}</span>
            <div>
                <h4>${automation.name}</h4>
                <div class="automation-meta">
                    <span>Type: ${automation.type}</span>
                    <span>Agent: ${automation.agentId}</span>
                </div>
            </div>
        </div>
        <div class="vault-status">
            <span>✅</span>
            <span>Wrapped & Synced</span>
        </div>
        <div class="automation-actions">
            <button class="btn-secondary" onclick="dashboard.viewAutomation('${automation.uuid}')">View</button>
            <button class="btn-primary" onclick="dashboard.testAutomation('${automation.agentId}')">Test</button>
        </div>
    `;
    
    listDiv.appendChild(card);
};

MirrorOSDashboard.prototype.getAutomationIcon = function(type) {
    const icons = {
        'n8n': '🔄',
        'make': '⚡',
        'notion': '📝',
        'zapier': '⚡',
        'generic': '🤖'
    };
    return icons[type] || '🔧';
};

MirrorOSDashboard.prototype.viewAutomation = async function(uuid) {
    // View automation details
    window.location.href = `/vault/automations/wrapped/${uuid}.json`;
};

MirrorOSDashboard.prototype.testAutomation = async function(agentId) {
    this.showNotification('Testing automation agent...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}/test`, {
            method: 'POST'
        });
        
        const result = await response.json();
        this.showNotification('Automation test completed', 'success');
    } catch (error) {
        this.showNotification('Automation test failed', 'error');
    }
};

// Initialize dashboard
window.dashboard = new MirrorOSDashboard();

// Export Modal Functions
window.showExportModal = async function(type, itemId, itemName) {
    const modal = document.getElementById('exportModal');
    document.getElementById('exportType').textContent = type.charAt(0).toUpperCase() + type.slice(1);
    document.getElementById('exportItemName').textContent = itemName || itemId;
    
    // Calculate export cost
    try {
        const response = await fetch(`${API_BASE}/export/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, itemId })
        });
        
        const preview = await response.json();
        document.getElementById('exportComplexity').textContent = preview.complexity || 'simple';
        document.getElementById('exportCost').textContent = preview.cost || 2;
        
        // Store for later
        modal.dataset.type = type;
        modal.dataset.itemId = itemId;
        modal.dataset.baseCost = preview.cost || 2;
    } catch (error) {
        console.error('Failed to preview export:', error);
    }
    
    modal.style.display = 'block';
};

window.updateExportCost = function() {
    const modal = document.getElementById('exportModal');
    const baseCost = parseFloat(modal.dataset.baseCost || 2);
    const includeVault = document.getElementById('includeVault').checked;
    
    const totalCost = baseCost + (includeVault ? 10 : 0);
    document.getElementById('exportCost').textContent = totalCost;
};

window.closeExportModal = function() {
    document.getElementById('exportModal').style.display = 'none';
};

window.confirmExport = async function() {
    const modal = document.getElementById('exportModal');
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    const exportData = {
        type: modal.dataset.type,
        itemId: modal.dataset.itemId,
        includeVault: document.getElementById('includeVault').checked,
        includeSecrets: document.getElementById('includeSecrets').checked,
        paymentMethod: paymentMethod
    };
    
    try {
        if (paymentMethod === 'stripe') {
            // Redirect to Stripe
            window.dashboard.showNotification('Redirecting to Stripe...', 'info');
            await initiateStripePayment(exportData);
            return;
        }
        
        const response = await fetch(`${API_BASE}/export/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exportData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.dashboard.showNotification('Export created successfully!', 'success');
            window.location.href = result.downloadUrl;
            closeExportModal();
            
            // Refresh credits if using credits
            if (paymentMethod === 'credits') {
                await window.dashboard.loadUserCredits();
            }
        } else {
            throw new Error(result.error || 'Export failed');
        }
    } catch (error) {
        window.dashboard.showNotification(error.message, 'error');
    }
};

// Billing Modal Functions
window.showBillingModal = async function() {
    const modal = document.getElementById('billingModal');
    
    // Load recent usage
    try {
        const response = await fetch(`${API_BASE}/billing/usage`);
        const usage = await response.json();
        
        const usageHtml = usage.recent.map(item => `
            <div class="usage-item">
                <span>${item.description}</span>
                <span>${item.credits} credits</span>
            </div>
        `).join('');
        
        document.getElementById('recentUsage').innerHTML = usageHtml || '<p>No recent usage</p>';
        
        // Load pending invoice
        const invoiceResponse = await fetch(`${API_BASE}/billing/invoice`);
        const invoice = await invoiceResponse.json();
        
        if (invoice.items && invoice.items.length > 0) {
            const invoiceHtml = `
                <div class="invoice-items">
                    ${invoice.items.map(item => `
                        <div class="invoice-item">
                            <span>${item.description}</span>
                            <span>$${item.amount.toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="invoice-total">
                        <strong>Total:</strong>
                        <strong>$${invoice.total.toFixed(2)}</strong>
                    </div>
                </div>
            `;
            document.getElementById('pendingInvoice').innerHTML = invoiceHtml;
        }
    } catch (error) {
        console.error('Failed to load billing data:', error);
    }
    
    modal.style.display = 'block';
};

window.closeBillingModal = function() {
    document.getElementById('billingModal').style.display = 'none';
};

window.purchaseCredits = async function(credits, price) {
    if (confirm(`Purchase ${credits} credits for $${price}?`)) {
        try {
            const response = await fetch(`${API_BASE}/billing/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits, price })
            });
            
            const result = await response.json();
            
            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                window.dashboard.showNotification('Purchase initiated', 'success');
                await window.dashboard.loadUserCredits();
                closeBillingModal();
            }
        } catch (error) {
            window.dashboard.showNotification('Purchase failed', 'error');
        }
    }
};

window.payInvoice = async function() {
    try {
        const response = await fetch(`${API_BASE}/billing/invoice/pay`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.checkoutUrl) {
            window.location.href = result.checkoutUrl;
        } else {
            window.dashboard.showNotification('No pending invoice', 'info');
        }
    } catch (error) {
        window.dashboard.showNotification('Payment failed', 'error');
    }
};

async function initiateStripePayment(exportData) {
    const response = await fetch(`${API_BASE}/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
    });
    
    const result = await response.json();
    
    if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
    } else {
        throw new Error('Failed to create checkout session');
    }
}

// Add export buttons to agent cards
MirrorOSDashboard.prototype.addExportButton = function(element, type, itemId, itemName) {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn-secondary';
    exportBtn.textContent = 'Export';
    exportBtn.onclick = () => showExportModal(type, itemId, itemName);
    element.appendChild(exportBtn);
};

// Load walkthrough script
const walkthroughScript = document.createElement('script');
walkthroughScript.src = 'walkthrough.js';
document.body.appendChild(walkthroughScript);

// Add billing button to header
document.addEventListener('DOMContentLoaded', () => {
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        const billingBtn = document.createElement('button');
        billingBtn.className = 'btn-secondary';
        billingBtn.textContent = 'Billing';
        billingBtn.onclick = showBillingModal;
        billingBtn.style.marginLeft = '1rem';
        headerRight.appendChild(billingBtn);
    }
});