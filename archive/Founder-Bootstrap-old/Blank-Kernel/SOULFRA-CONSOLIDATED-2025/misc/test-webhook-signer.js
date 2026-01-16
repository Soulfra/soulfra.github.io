#!/usr/bin/env node

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class TestWebhookSigner {
    constructor(port = 3333) {
        this.port = port;
        this.app = express();
        this.soulkeys = this.loadSoulkeys();
        this.approvedActions = [];
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    loadSoulkeys() {
        const keys = {};
        const soulkeyPath = path.join(__dirname, 'soulkeys');
        
        ['soulkey_primary.json', 'soulkey_shadow.json'].forEach(filename => {
            try {
                const keyPath = path.join(soulkeyPath, filename);
                keys[filename.split('.')[0]] = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            } catch (e) {
                console.error(`Failed to load ${filename}:`, e.message);
            }
        });
        
        return keys;
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // Log all requests
        this.app.use((req, res, next) => {
            console.log(`📨 ${req.method} ${req.path}`, req.headers['x-vault-request'] || '');
            next();
        });
    }
    
    setupRoutes() {
        // Approval endpoint
        this.app.post('/approve', async (req, res) => {
            const request = req.body;
            
            console.log('\n🔐 Approval request received:');
            console.log(`   Action: ${request.action}`);
            console.log(`   ID: ${request.id}`);
            
            // Simulate decision logic
            const decision = await this.makeDecision(request);
            
            if (decision.approve) {
                const response = this.signApproval(request, decision.keyType);
                this.approvedActions.push({
                    request,
                    response,
                    timestamp: Date.now()
                });
                
                console.log(`✅ Approved with ${decision.keyType}`);
                res.json(response);
            } else {
                console.log(`❌ Denied: ${decision.reason}`);
                res.json({
                    status: 'denied',
                    reason: decision.reason,
                    timestamp: Date.now(),
                    signed_by: 'none',
                    signature: 'none'
                });
            }
        });
        
        // Status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                status: 'online',
                soulkeys_loaded: Object.keys(this.soulkeys),
                approved_count: this.approvedActions.length,
                last_approval: this.approvedActions[this.approvedActions.length - 1] || null
            });
        });
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'approval-dashboard.html'));
        });
        
        // Get recent approvals
        this.app.get('/approvals', (req, res) => {
            res.json({
                approvals: this.approvedActions.slice(-10).reverse()
            });
        });
        
        // Manual approval endpoint
        this.app.post('/manual-approve', (req, res) => {
            const { requestId, approve, keyType } = req.body;
            
            // Find pending request (in real system, would lookup from queue)
            const mockRequest = {
                id: requestId,
                action: 'manual.approval',
                data: { manual: true },
                timestamp: Date.now()
            };
            
            if (approve) {
                const response = this.signApproval(mockRequest, keyType || 'soulkey_primary');
                this.approvedActions.push({
                    request: mockRequest,
                    response,
                    timestamp: Date.now()
                });
                res.json({ success: true, response });
            } else {
                res.json({ success: false, reason: 'manually_denied' });
            }
        });
    }
    
    async makeDecision(request) {
        // Automatic approval logic (customize as needed)
        
        // Always approve clone.fork for testing
        if (request.action === 'clone.fork') {
            return { approve: true, keyType: 'soulkey_primary' };
        }
        
        // Approve agent.publish if confidence is high
        if (request.action === 'agent.publish' && request.data?.confidence > 0.8) {
            return { approve: true, keyType: 'soulkey_primary' };
        }
        
        // Use shadow key for emergency actions
        if (request.data?.emergency) {
            return { approve: true, keyType: 'soulkey_shadow' };
        }
        
        // Deny vault.push without proper soul imprint
        if (request.action === 'vault.push' && !request.data?.soul_imprint) {
            return { approve: false, reason: 'missing_soul_imprint' };
        }
        
        // Default: approve with primary key
        return { approve: true, keyType: 'soulkey_primary' };
    }
    
    signApproval(request, keyType) {
        const soulkey = this.soulkeys[keyType];
        if (!soulkey) {
            throw new Error(`Soulkey ${keyType} not found`);
        }
        
        const response = {
            status: 'approved',
            signed_by: keyType,
            timestamp: Date.now(),
            signature: null
        };
        
        // Create signature
        const signedContent = {
            request_id: request.id,
            action: request.action,
            status: response.status,
            timestamp: response.timestamp
        };
        
        response.signature = crypto
            .createHmac('sha256', soulkey.public_key)
            .update(JSON.stringify(signedContent))
            .digest('hex');
        
        return response;
    }
    
    start() {
        // Create dashboard HTML if it doesn't exist
        this.createDashboard();
        
        this.server = this.app.listen(this.port, () => {
            console.log('\n🗝️  TEST WEBHOOK SIGNER');
            console.log('=' .repeat(50));
            console.log(`🌐 Server: http://localhost:${this.port}`);
            console.log(`📡 Webhook endpoint: http://localhost:${this.port}/approve`);
            console.log(`📊 Dashboard: http://localhost:${this.port}`);
            console.log(`🔑 Soulkeys loaded: ${Object.keys(this.soulkeys).join(', ')}`);
            console.log('=' .repeat(50));
            console.log('\nWaiting for approval requests...\n');
        });
    }
    
    createDashboard() {
        const dashboardPath = path.join(__dirname, 'approval-dashboard.html');
        if (!fs.existsSync(dashboardPath)) {
            fs.writeFileSync(dashboardPath, this.getDashboardHTML());
        }
    }
    
    getDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Soulkey Approval Dashboard</title>
    <style>
        body {
            font-family: monospace;
            background: #000;
            color: #0f0;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #0ff;
            text-shadow: 0 0 10px #0ff;
        }
        .status {
            border: 1px solid #0f0;
            padding: 10px;
            margin: 20px 0;
            background: #001100;
        }
        .approval {
            border: 1px solid #0ff;
            padding: 15px;
            margin: 10px 0;
            background: #000033;
        }
        .approved {
            border-color: #0f0;
            background: #001100;
        }
        .denied {
            border-color: #f00;
            background: #110000;
        }
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            font-family: monospace;
            font-weight: bold;
        }
        button:hover {
            background: #0ff;
            box-shadow: 0 0 10px #0ff;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
        }
        .action {
            color: #ff0;
            font-weight: bold;
        }
        .signature {
            color: #666;
            word-break: break-all;
            font-size: 0.8em;
        }
        #log {
            border: 1px solid #333;
            padding: 10px;
            height: 200px;
            overflow-y: auto;
            background: #000011;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗝️ Soulkey Approval Dashboard</h1>
        
        <div class="status" id="status">
            Loading status...
        </div>
        
        <h2>Manual Approval</h2>
        <div>
            <input type="text" id="requestId" placeholder="Request ID" style="background: #000; color: #0f0; border: 1px solid #0f0; padding: 5px;">
            <button onclick="manualApprove('primary')">Approve (Primary)</button>
            <button onclick="manualApprove('shadow')">Approve (Shadow)</button>
            <button onclick="manualDeny()">Deny</button>
        </div>
        
        <h2>Recent Approvals</h2>
        <div id="approvals">
            Loading approvals...
        </div>
        
        <h2>Live Log</h2>
        <div id="log"></div>
    </div>
    
    <script>
        let ws;
        
        async function loadStatus() {
            const res = await fetch('/status');
            const data = await res.json();
            
            document.getElementById('status').innerHTML = \`
                <h3>System Status</h3>
                <p>Status: <span style="color: #0f0">\${data.status}</span></p>
                <p>Soulkeys: \${data.soulkeys_loaded.join(', ')}</p>
                <p>Approved Actions: \${data.approved_count}</p>
            \`;
        }
        
        async function loadApprovals() {
            const res = await fetch('/approvals');
            const data = await res.json();
            
            const approvalsHtml = data.approvals.map(item => \`
                <div class="approval \${item.response.status === 'approved' ? 'approved' : 'denied'}">
                    <div class="action">\${item.request.action}</div>
                    <div>ID: \${item.request.id}</div>
                    <div>Status: \${item.response.status}</div>
                    <div>Signed by: \${item.response.signed_by}</div>
                    <div class="signature">Signature: \${item.response.signature}</div>
                    <div class="timestamp">\${new Date(item.timestamp).toLocaleString()}</div>
                </div>
            \`).join('');
            
            document.getElementById('approvals').innerHTML = approvalsHtml || '<p>No approvals yet</p>';
        }
        
        async function manualApprove(keyType) {
            const requestId = document.getElementById('requestId').value;
            if (!requestId) {
                alert('Please enter a request ID');
                return;
            }
            
            const res = await fetch('/manual-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    approve: true,
                    keyType: 'soulkey_' + keyType
                })
            });
            
            const data = await res.json();
            log(\`Manual approval: \${data.success ? 'SUCCESS' : 'FAILED'}\`);
            
            document.getElementById('requestId').value = '';
            loadApprovals();
        }
        
        async function manualDeny() {
            const requestId = document.getElementById('requestId').value;
            if (!requestId) {
                alert('Please enter a request ID');
                return;
            }
            
            const res = await fetch('/manual-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    approve: false
                })
            });
            
            const data = await res.json();
            log(\`Manual denial: \${data.success === false ? 'SUCCESS' : 'FAILED'}\`);
            
            document.getElementById('requestId').value = '';
        }
        
        function log(message) {
            const logDiv = document.getElementById('log');
            const entry = document.createElement('div');
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        // Auto-refresh
        setInterval(() => {
            loadStatus();
            loadApprovals();
        }, 2000);
        
        // Initial load
        loadStatus();
        loadApprovals();
        log('Dashboard initialized');
    </script>
</body>
</html>`;
    }
    
    stop() {
        if (this.server) {
            this.server.close();
            console.log('\n🛑 Webhook signer stopped');
        }
    }
}

// Run the server
if (require.main === module) {
    const signer = new TestWebhookSigner();
    signer.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down...');
        signer.stop();
        process.exit(0);
    });
}

module.exports = TestWebhookSigner;