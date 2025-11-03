# Module: mirror-ui-admin.html (Platform Mode Interface)
**Purpose**: Professional dashboard for power users with full system control  
**Dependencies**: WebSocket connections, ConfigManager, real-time data APIs  
**Success Criteria**: Enterprise users can monitor, configure, and manage all Mirror Kernel operations  

---

## Implementation Requirements

### HTML Structure Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mirror Platform Console</title>
    <!-- TODO: Add professional styling imports -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    
    <style>
        /* TODO: Implement professional dashboard CSS (see styling section) */
    </style>
</head>
<body class="platform-mode">
    <!-- TODO: Implement layout structure (see components section) -->
    
    <script>
        // TODO: Implement dashboard functionality (see JavaScript section)
    </script>
</body>
</html>
```

---

## Component Structure

### 1. Header with System Status
```html
<!-- TODO: Create professional header with system monitoring -->
<header class="platform-header">
    <div class="header-left">
        <h1 class="platform-title">
            <span class="title-icon">🏢</span>
            Mirror Platform Console
        </h1>
        <div class="system-status" id="systemStatus">
            <span class="status-indicator active" id="statusIndicator"></span>
            <span class="status-text" id="statusText">System Online</span>
            <span class="uptime" id="uptime">Uptime: 2d 14h 32m</span>
        </div>
    </div>
    
    <div class="header-right">
        <div class="mode-controls">
            <button class="mode-switch-btn" id="switchToSoftMode">
                <span class="btn-icon">🌸</span>
                Switch to Soft Mode
            </button>
        </div>
        
        <div class="user-info">
            <span class="user-name" id="userName">Platform Admin</span>
            <div class="mode-badge platform">PLATFORM MODE</div>
        </div>
    </div>
</header>
```

### 2. Sidebar Navigation
```html
<!-- TODO: Create comprehensive navigation sidebar -->
<nav class="sidebar" id="sidebar">
    <div class="nav-section">
        <h3 class="nav-section-title">Overview</h3>
        <a href="#dashboard" class="nav-item active" data-section="dashboard">
            <span class="nav-icon">📊</span>
            <span class="nav-text">Dashboard</span>
        </a>
        <a href="#agents" class="nav-item" data-section="agents">
            <span class="nav-icon">🤖</span>
            <span class="nav-text">Agent Registry</span>
            <span class="nav-badge" id="agentCount">7</span>
        </a>
        <a href="#analytics" class="nav-item" data-section="analytics">
            <span class="nav-icon">📈</span>
            <span class="nav-text">Analytics</span>
        </a>
    </div>
    
    <div class="nav-section">
        <h3 class="nav-section-title">Management</h3>
        <a href="#logs" class="nav-item" data-section="logs">
            <span class="nav-icon">📋</span>
            <span class="nav-text">System Logs</span>
        </a>
        <a href="#forks" class="nav-item" data-section="forks">
            <span class="nav-icon">🔀</span>
            <span class="nav-text">Fork Management</span>
        </a>
        <a href="#api" class="nav-item" data-section="api">
            <span class="nav-icon">🔧</span>
            <span class="nav-text">API Configuration</span>
        </a>
        <a href="#billing" class="nav-item" data-section="billing">
            <span class="nav-icon">💳</span>
            <span class="nav-text">Billing & Usage</span>
        </a>
    </div>
    
    <div class="nav-section">
        <h3 class="nav-section-title">Tools</h3>
        <a href="#export" class="nav-item" data-section="export">
            <span class="nav-icon">📤</span>
            <span class="nav-text">Bulk Export</span>
        </a>
        <a href="#mirror-index" class="nav-item" data-section="mirror-index">
            <span class="nav-icon">🔍</span>
            <span class="nav-text">Mirror Index</span>
        </a>
    </div>
</nav>
```

### 3. Dashboard Overview Section
```html
<!-- TODO: Create comprehensive dashboard with real-time metrics -->
<main class="main-content">
    <section class="content-section active" id="dashboard-section">
        <div class="section-header">
            <h2 class="section-title">System Overview</h2>
            <div class="refresh-controls">
                <button class="refresh-btn" id="refreshDashboard">
                    <span class="btn-icon">🔄</span>
                    Refresh
                </button>
                <div class="auto-refresh">
                    <label>
                        <input type="checkbox" id="autoRefresh" checked>
                        Auto-refresh (30s)
                    </label>
                </div>
            </div>
        </div>
        
        <!-- Metrics Grid -->
        <div class="metrics-grid">
            <div class="metric-card">
                <h3 class="metric-title">System Performance</h3>
                <div class="metric-row">
                    <span class="metric-label">Runtime Status</span>
                    <span class="metric-value success" id="runtimeStatus">ACTIVE</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Active Agents</span>
                    <span class="metric-value" id="activeAgents">7</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value" id="memoryUsage">245 MB</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">CPU Usage</span>
                    <span class="metric-value" id="cpuUsage">23%</span>
                </div>
            </div>
            
            <div class="metric-card">
                <h3 class="metric-title">API Usage (24h)</h3>
                <div class="metric-row">
                    <span class="metric-label">Total Calls</span>
                    <span class="metric-value" id="totalCalls">1,247</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">BYOK Calls</span>
                    <span class="metric-value success" id="byokCalls">891</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Stripe Calls</span>
                    <span class="metric-value" id="stripeCalls">356</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Error Rate</span>
                    <span class="metric-value warning" id="errorRate">2.3%</span>
                </div>
            </div>
            
            <div class="metric-card">
                <h3 class="metric-title">Financial Overview</h3>
                <div class="metric-row">
                    <span class="metric-label">Today's Revenue</span>
                    <span class="metric-value success" id="todayRevenue">$47.23</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">BYOK Savings</span>
                    <span class="metric-value success" id="byokSavings">$128.91</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Monthly Total</span>
                    <span class="metric-value" id="monthlyTotal">$1,284.67</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Avg per Call</span>
                    <span class="metric-value" id="avgPerCall">$0.037</span>
                </div>
            </div>
        </div>
        
        <!-- Real-time Activity Feed -->
        <div class="activity-section">
            <h3 class="section-subtitle">Real-time Activity</h3>
            <div class="terminal-container">
                <div class="terminal" id="activityTerminal">
                    <div class="terminal-header">
                        <span class="terminal-title">System Activity Log</span>
                        <div class="terminal-controls">
                            <button class="terminal-btn" id="clearTerminal">Clear</button>
                            <button class="terminal-btn" id="pauseTerminal">Pause</button>
                        </div>
                    </div>
                    <div class="terminal-content" id="terminalContent">
                        <!-- Real-time log entries will be inserted here -->
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- TODO: Add other sections (agents, billing, etc.) -->
</main>
```

### 4. Agent Registry Section
```html
<!-- TODO: Create agent management interface -->
<section class="content-section" id="agents-section">
    <div class="section-header">
        <h2 class="section-title">Agent Registry</h2>
        <div class="section-actions">
            <button class="action-btn primary" id="spawnNewAgent">
                <span class="btn-icon">➕</span>
                Spawn New Agent
            </button>
            <button class="action-btn secondary" id="bulkManageAgents">
                <span class="btn-icon">⚙️</span>
                Bulk Manage
            </button>
        </div>
    </div>
    
    <div class="table-container">
        <table class="data-table" id="agentsTable">
            <thead>
                <tr>
                    <th>Agent ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Memory Usage</th>
                    <th>Last Active</th>
                    <th>Performance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="agentsTableBody">
                <!-- Agent rows will be populated dynamically -->
            </tbody>
        </table>
    </div>
    
    <!-- Agent Details Modal -->
    <div class="modal hidden" id="agentModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="agentModalTitle">Agent Details</h3>
                <button class="modal-close" id="closeAgentModal">&times;</button>
            </div>
            <div class="modal-body" id="agentModalBody">
                <!-- Agent details will be loaded here -->
            </div>
        </div>
    </div>
</section>
```

### 5. Billing & API Configuration Section
```html
<!-- TODO: Create billing and API management interface -->
<section class="content-section" id="billing-section">
    <div class="billing-overview">
        <div class="billing-card primary">
            <h3 class="billing-title">Current Usage</h3>
            <div class="billing-amount">$47.23</div>
            <div class="billing-period">This month • $0.01 per API call</div>
        </div>
    </div>
    
    <div class="config-grid">
        <div class="config-card">
            <h3 class="config-title">API Key Configuration</h3>
            <form class="config-form" id="apiKeyForm">
                <div class="form-group">
                    <label class="form-label">OpenAI API Key</label>
                    <div class="input-group">
                        <input type="password" class="form-input" id="openaiKey" placeholder="sk-...">
                        <button type="button" class="input-btn" id="testOpenaiKey">Test</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Anthropic API Key</label>
                    <div class="input-group">
                        <input type="password" class="form-input" id="anthropicKey" placeholder="sk-ant-...">
                        <button type="button" class="input-btn" id="testAnthropicKey">Test</button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="action-btn primary">
                        <span class="btn-icon">💾</span>
                        Save Configuration
                    </button>
                    <button type="button" class="action-btn secondary" id="rotateKeys">
                        <span class="btn-icon">🔄</span>
                        Rotate Keys
                    </button>
                </div>
            </form>
        </div>
        
        <div class="config-card">
            <h3 class="config-title">Usage Analytics</h3>
            <div class="usage-chart" id="usageChart">
                <!-- Chart will be rendered here -->
            </div>
        </div>
    </div>
</section>
```

---

## CSS Styling (Professional Theme)

### Core Styling Framework
```css
/* TODO: Implement professional dashboard styling */
:root {
    --primary-color: #1f6feb;
    --secondary-color: #0d419d;
    --success-color: #238636;
    --warning-color: #d29922;
    --error-color: #da3633;
    
    --bg-primary: #0d1117;
    --bg-secondary: #161b22;
    --bg-tertiary: #21262d;
    --bg-hover: #30363d;
    
    --text-primary: #f0f6fc;
    --text-secondary: #c9d1d9;
    --text-muted: #8b949e;
    --text-inverse: #24292f;
    
    --border-color: #30363d;
    --border-muted: #21262d;
    
    --font-mono: 'JetBrains Mono', 'Monaco', 'Menlo', monospace;
    --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    --border-radius: 8px;
    --border-radius-sm: 4px;
    --shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    --shadow-hover: 0 12px 32px rgba(0, 0, 0, 0.4);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-system);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.5;
    overflow-x: hidden;
}

/* Layout */
.platform-mode {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: 250px 1fr;
    grid-template-areas: 
        "header header"
        "sidebar main";
    min-height: 100vh;
}

.platform-header {
    grid-area: header;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding: var(--spacing-md) var(--spacing-xl);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
}

.sidebar {
    grid-area: sidebar;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    padding: var(--spacing-lg);
    overflow-y: auto;
}

.main-content {
    grid-area: main;
    padding: var(--spacing-xl);
    overflow-y: auto;
}
```

### Component Styling
```css
/* TODO: Style dashboard components */

/* Header Components */
.platform-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.system-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xs);
    font-size: 0.875rem;
    color: var(--text-muted);
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--error-color);
}

.status-indicator.active {
    background: var(--success-color);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.mode-badge {
    background: var(--success-color);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Navigation */
.nav-section {
    margin-bottom: var(--spacing-xl);
}

.nav-section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-md);
}

.nav-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    margin-bottom: var(--spacing-xs);
    border-radius: var(--border-radius-sm);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    position: relative;
}

.nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}

.nav-item.active {
    background: var(--primary-color);
    color: white;
}

.nav-badge {
    background: var(--bg-tertiary);
    color: var(--text-muted);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-left: auto;
}

/* Metrics Grid */
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
}

.metric-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
}

.metric-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
}

.metric-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-muted);
}

.metric-row:last-child {
    border-bottom: none;
}

.metric-label {
    color: var(--text-muted);
    font-size: 0.875rem;
}

.metric-value {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-primary);
}

.metric-value.success {
    color: var(--success-color);
}

.metric-value.warning {
    color: var(--warning-color);
}

.metric-value.error {
    color: var(--error-color);
}

/* Terminal Styling */
.terminal-container {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    overflow: hidden;
}

.terminal-header {
    background: var(--bg-tertiary);
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.terminal-title {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.terminal-content {
    padding: var(--spacing-md);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    max-height: 400px;
    overflow-y: auto;
    line-height: 1.4;
}

.log-entry {
    margin-bottom: var(--spacing-xs);
    display: flex;
    gap: var(--spacing-sm);
}

.log-timestamp {
    color: var(--text-muted);
    flex-shrink: 0;
}

.log-level {
    flex-shrink: 0;
    width: 60px;
    font-weight: 600;
}

.log-level.info {
    color: var(--primary-color);
}

.log-level.success {
    color: var(--success-color);
}

.log-level.warning {
    color: var(--warning-color);
}

.log-level.error {
    color: var(--error-color);
}

.log-message {
    color: var(--text-secondary);
}

/* Data Tables */
.table-container {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    overflow: hidden;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: var(--spacing-md);
    text-align: left;
    border-bottom: 1px solid var(--border-muted);
    font-size: 0.875rem;
}

.data-table th {
    background: var(--bg-tertiary);
    font-weight: 600;
    color: var(--text-primary);
    position: sticky;
    top: 0;
    z-index: 10;
}

.data-table td {
    color: var(--text-secondary);
}

.data-table tbody tr:hover {
    background: var(--bg-hover);
}

/* Buttons */
.action-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--border-radius-sm);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
}

.action-btn.primary {
    background: var(--primary-color);
    color: white;
}

.action-btn.primary:hover {
    background: var(--secondary-color);
}

.action-btn.secondary {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
}

.action-btn.secondary:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}
```

---

## JavaScript Functionality

### Core Dashboard Class
```javascript
// TODO: Implement main dashboard logic
class PlatformDashboard {
    constructor() {
        this.websocket = null;
        this.currentSection = 'dashboard';
        this.autoRefreshInterval = null;
        this.isRealTimeEnabled = true;
        
        this.init();
    }

    async init() {
        console.log('🏢 Initializing Platform Dashboard...');
        
        // Setup WebSocket for real-time updates
        await this.setupWebSocket();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        console.log('✅ Platform Dashboard initialized');
    }

    async setupWebSocket() {
        // TODO: Setup WebSocket connection for real-time updates
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/platform`;
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('🔌 WebSocket connected');
                this.updateConnectionStatus(true);
            };
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };
            
            this.websocket.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.updateConnectionStatus(false);
                
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.setupWebSocket(), 5000);
            };
            
            this.websocket.onerror = (error) => {
                console.error('🔌 WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
        }
    }

    async loadDashboardData() {
        // TODO: Load all dashboard data
        try {
            const [systemStats, agentStats, usageStats, billingStats] = await Promise.all([
                fetch('/api/platform/system-stats').then(r => r.json()),
                fetch('/api/platform/agent-stats').then(r => r.json()),
                fetch('/api/platform/usage-stats').then(r => r.json()),
                fetch('/api/platform/billing-stats').then(r => r.json())
            ]);

            this.updateSystemMetrics(systemStats);
            this.updateAgentMetrics(agentStats);
            this.updateUsageMetrics(usageStats);
            this.updateBillingMetrics(billingStats);
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showErrorMessage('Failed to load dashboard data');
        }
    }

    setupNavigation() {
        // TODO: Setup sidebar navigation
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = item.dataset.section;
                this.navigateToSection(section);
            });
        });
    }

    navigateToSection(sectionName) {
        // TODO: Handle section navigation
        if (this.currentSection === sectionName) return;
        
        // Update navigation state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        // Hide current section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show new section
        const newSection = document.getElementById(`${sectionName}-section`);
        if (newSection) {
            newSection.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        // TODO: Load data specific to each section
        switch (sectionName) {
            case 'agents':
                await this.loadAgentRegistry();
                break;
            case 'billing':
                await this.loadBillingData();
                break;
            case 'logs':
                await this.loadSystemLogs();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
            default:
                // Dashboard is already loaded
                break;
        }
    }

    async loadAgentRegistry() {
        // TODO: Load and display agent registry
        try {
            const response = await fetch('/api/platform/agents');
            const agents = await response.json();
            
            const tableBody = document.getElementById('agentsTableBody');
            tableBody.innerHTML = '';
            
            agents.forEach(agent => {
                const row = this.createAgentRow(agent);
                tableBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Failed to load agent registry:', error);
        }
    }

    createAgentRow(agent) {
        // TODO: Create table row for agent
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="agent-id">${agent.id}</td>
            <td class="agent-type">
                <span class="type-badge type-${agent.type}">${agent.type}</span>
            </td>
            <td class="agent-status">
                <span class="status-badge status-${agent.status}">${agent.status}</span>
            </td>
            <td class="agent-memory">${agent.memoryUsage}</td>
            <td class="agent-activity">${this.formatTimeAgo(agent.lastActive)}</td>
            <td class="agent-performance">
                <div class="performance-bar">
                    <div class="performance-fill" style="width: ${agent.performance}%"></div>
                </div>
                <span class="performance-text">${agent.performance}%</span>
            </td>
            <td class="agent-actions">
                <button class="action-btn secondary small" onclick="dashboard.viewAgent('${agent.id}')">
                    View
                </button>
                <button class="action-btn secondary small" onclick="dashboard.restartAgent('${agent.id}')">
                    Restart
                </button>
            </td>
        `;
        
        return row;
    }

    handleRealTimeUpdate(data) {
        // TODO: Handle real-time WebSocket updates
        switch (data.type) {
            case 'system_stats':
                this.updateSystemMetrics(data.payload);
                break;
            case 'agent_event':
                this.handleAgentEvent(data.payload);
                break;
            case 'api_call':
                this.handleAPICall(data.payload);
                break;
            case 'log_entry':
                this.addLogEntry(data.payload);
                break;
            default:
                console.log('Unknown real-time update:', data);
        }
    }

    updateSystemMetrics(stats) {
        // TODO: Update system performance metrics
        document.getElementById('runtimeStatus').textContent = stats.status.toUpperCase();
        document.getElementById('activeAgents').textContent = stats.activeAgents;
        document.getElementById('memoryUsage').textContent = `${stats.memoryUsage} MB`;
        document.getElementById('cpuUsage').textContent = `${stats.cpuUsage}%`;
        document.getElementById('uptime').textContent = `Uptime: ${stats.uptime}`;
        
        // Update status indicator
        const statusIndicator = document.getElementById('statusIndicator');
        statusIndicator.className = `status-indicator ${stats.status === 'active' ? 'active' : 'inactive'}`;
    }

    updateUsageMetrics(stats) {
        // TODO: Update API usage metrics
        document.getElementById('totalCalls').textContent = stats.totalCalls.toLocaleString();
        document.getElementById('byokCalls').textContent = stats.byokCalls.toLocaleString();
        document.getElementById('stripeCalls').textContent = stats.stripeCalls.toLocaleString();
        document.getElementById('errorRate').textContent = `${stats.errorRate}%`;
    }

    updateBillingMetrics(stats) {
        // TODO: Update billing and financial metrics
        document.getElementById('todayRevenue').textContent = `$${stats.todayRevenue.toFixed(2)}`;
        document.getElementById('byokSavings').textContent = `$${stats.byokSavings.toFixed(2)}`;
        document.getElementById('monthlyTotal').textContent = `$${stats.monthlyTotal.toFixed(2)}`;
        document.getElementById('avgPerCall').textContent = `$${stats.avgPerCall.toFixed(3)}`;
    }

    addLogEntry(logEntry) {
        // TODO: Add new log entry to terminal
        const terminal = document.getElementById('terminalContent');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        entry.innerHTML = `
            <span class="log-timestamp">${this.formatTimestamp(logEntry.timestamp)}</span>
            <span class="log-level ${logEntry.level}">[${logEntry.level.toUpperCase()}]</span>
            <span class="log-message">${logEntry.message}</span>
        `;
        
        terminal.appendChild(entry);
        
        // Auto-scroll to bottom
        terminal.scrollTop = terminal.scrollHeight;
        
        // Limit log entries to 1000
        const entries = terminal.querySelectorAll('.log-entry');
        if (entries.length > 1000) {
            entries[0].remove();
        }
    }

    setupEventListeners() {
        // TODO: Setup all event listeners
        
        // Refresh controls
        document.getElementById('refreshDashboard').addEventListener('click', () => {
            this.loadDashboardData();
        });
        
        document.getElementById('autoRefresh').addEventListener('change', (e) => {
            this.isRealTimeEnabled = e.target.checked;
            if (this.isRealTimeEnabled) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });
        
        // Terminal controls
        document.getElementById('clearTerminal').addEventListener('click', () => {
            document.getElementById('terminalContent').innerHTML = '';
        });
        
        document.getElementById('pauseTerminal').addEventListener('click', (e) => {
            const isPaused = e.target.textContent === 'Resume';
            e.target.textContent = isPaused ? 'Pause' : 'Resume';
            this.isRealTimeEnabled = isPaused;
        });
        
        // Mode switching
        document.getElementById('switchToSoftMode').addEventListener('click', () => {
            this.switchToSoftMode();
        });
        
        // Agent management
        document.getElementById('spawnNewAgent').addEventListener('click', () => {
            this.showSpawnAgentDialog();
        });
        
        // API key form
        document.getElementById('apiKeyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAPIConfiguration();
        });
    }

    startAutoRefresh() {
        // TODO: Start automatic refresh
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(() => {
            if (this.isRealTimeEnabled) {
                this.loadDashboardData();
            }
        }, 30000); // 30 seconds
    }

    stopAutoRefresh() {
        // TODO: Stop automatic refresh
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    async switchToSoftMode() {
        // TODO: Switch to soft mode
        if (confirm('Switch to Soft Mode? You will lose access to advanced features.')) {
            try {
                await fetch('/api/platform/switch-mode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: 'soft' })
                });
                
                // Redirect to soft mode interface
                window.location.href = '/';
                
            } catch (error) {
                console.error('Failed to switch mode:', error);
                this.showErrorMessage('Failed to switch to Soft Mode');
            }
        }
    }

    formatTimestamp(timestamp) {
        // TODO: Format timestamp for display
        return new Date(timestamp).toLocaleTimeString();
    }

    formatTimeAgo(timestamp) {
        // TODO: Format relative time
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    }

    showErrorMessage(message) {
        // TODO: Show error notification
        console.error(message);
        // Add UI notification system
    }

    updateConnectionStatus(connected) {
        // TODO: Update WebSocket connection status
        const statusText = document.getElementById('statusText');
        if (connected) {
            statusText.textContent = 'System Online';
            statusText.className = 'status-text connected';
        } else {
            statusText.textContent = 'Connection Lost';
            statusText.className = 'status-text disconnected';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new PlatformDashboard();
});
```

---

## Integration Points

### WebSocket Events
- `system_stats` → Real-time system performance updates
- `agent_event` → Agent status changes and spawning
- `api_call` → Live API usage tracking
- `log_entry` → Real-time system logging
- `billing_update` → Cost and usage updates

### API Endpoints Used
- `GET /api/platform/system-stats` → System performance metrics
- `GET /api/platform/agents` → Agent registry data
- `POST /api/platform/switch-mode` → Mode switching
- `POST /api/platform/spawn-agent` → Create new agents
- `PUT /api/platform/api-keys` → Update API configuration

### Local Storage
```javascript
// Store dashboard preferences
localStorage.setItem('platform_layout', JSON.stringify(layoutSettings));
localStorage.setItem('platform_filters', JSON.stringify(filterSettings));
```

**Implementation Priority**: Start with basic layout and navigation, add real-time updates via WebSocket, implement agent management, then add billing and advanced features.