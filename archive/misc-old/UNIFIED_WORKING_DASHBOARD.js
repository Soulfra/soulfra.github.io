#!/usr/bin/env node

/**
 * UNIFIED WORKING DASHBOARD
 * 
 * Connects your existing working systems:
 * - Cal Dashboard (4040) - ALREADY WORKS
 * - AI Economy Game (3003) - ALREADY WORKS  
 * - Domingo Economy (5055) - ALREADY WORKS
 * 
 * No new systems, just a unified interface.
 */

const express = require('express');
const http = require('http');
const app = express();
const PORT = 8888;

app.use(express.json());
app.use(express.static(__dirname));

// Multi-user tracking
const users = new Map();
const sessions = new Map();

// Main unified interface
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Unified Working Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0a0a;
            color: #fff;
            overflow: hidden;
        }
        
        .header {
            background: #111;
            border-bottom: 2px solid #00ff88;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            color: #00ff88;
            font-size: 24px;
        }
        
        .user-info {
            display: flex;
            gap: 20px;
            align-items: center;
            font-size: 14px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff88;
            display: inline-block;
            margin-right: 5px;
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            height: calc(100vh - 60px);
            gap: 1px;
            background: #333;
        }
        
        .system-frame {
            background: #000;
            position: relative;
            overflow: hidden;
        }
        
        .system-header {
            background: #222;
            padding: 8px 12px;
            font-size: 12px;
            color: #00ff88;
            border-bottom: 1px solid #444;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .system-iframe {
            width: 100%;
            height: calc(100% - 32px);
            border: none;
            background: #000;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            font-size: 10px;
            color: #888;
        }
        
        .status-online { color: #00ff88; }
        .status-offline { color: #ff6b6b; }
        
        .user-panel {
            position: fixed;
            top: 70px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            border: 1px solid #444;
            border-radius: 8px;
            padding: 15px;
            min-width: 200px;
            z-index: 1000;
        }
        
        .user-input {
            width: 100%;
            padding: 8px;
            background: #222;
            border: 1px solid #444;
            color: #fff;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .user-btn {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .user-btn:hover {
            background: #00cc6a;
        }
        
        .quick-actions {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .action-btn {
            background: #444;
            color: #fff;
            border: none;
            padding: 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            min-width: 120px;
        }
        
        .action-btn:hover {
            background: #555;
        }
        
        .action-btn.primary {
            background: #00ff88;
            color: #000;
        }
        
        .action-btn.primary:hover {
            background: #00cc6a;
        }
        
        @media (max-width: 1200px) {
            .main-grid {
                grid-template-columns: 1fr;
                grid-template-rows: 1fr 1fr 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Unified Working Dashboard</h1>
        <div class="user-info">
            <div><span class="status-dot"></span>Cal Dashboard</div>
            <div><span class="status-dot"></span>AI Economy</div>
            <div><span class="status-dot"></span>Domingo</div>
            <div>User: <span id="user-name">Loading...</span></div>
        </div>
    </div>
    
    <div class="main-grid">
        <!-- Cal Dashboard -->
        <div class="system-frame">
            <div class="system-header">
                <span>🧠 Cal Riven Dashboard (Port 4040)</span>
                <span class="status-indicator status-online">● WORKING</span>
            </div>
            <iframe class="system-iframe" src="http://localhost:4040" title="Cal Dashboard"></iframe>
        </div>
        
        <!-- AI Economy Game -->
        <div class="system-frame">
            <div class="system-header">
                <span>🎮 AI Economy Game (Port 3003)</span>
                <span class="status-indicator status-online">● WORKING</span>
            </div>
            <iframe class="system-iframe" src="http://localhost:3003" title="AI Economy"></iframe>
        </div>
        
        <!-- Domingo Economy -->
        <div class="system-frame">
            <div class="system-header">
                <span>💰 Domingo Economy (Port 5055)</span>
                <span class="status-indicator status-online">● WORKING</span>
            </div>
            <iframe class="system-iframe" src="http://localhost:5055" title="Domingo Economy"></iframe>
        </div>
    </div>
    
    <div class="user-panel" id="user-panel" style="display: none;">
        <h4 style="margin-bottom: 10px; color: #00ff88;">User Setup</h4>
        <input type="text" class="user-input" id="user-name-input" placeholder="Enter your name">
        <button class="user-btn" onclick="saveUser()">Save</button>
    </div>
    
    <div class="quick-actions">
        <button class="action-btn" onclick="toggleUserPanel()">User Settings</button>
        <button class="action-btn" onclick="refreshAll()">Refresh All</button>
        <button class="action-btn primary" onclick="openAll()">Open All Systems</button>
        <button class="action-btn" onclick="checkStatus()">System Status</button>
    </div>

    <script>
        // User management
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        
        // Load user name
        const savedName = localStorage.getItem('userName') || 'Anonymous';
        document.getElementById('user-name').textContent = savedName;
        
        function toggleUserPanel() {
            const panel = document.getElementById('user-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            document.getElementById('user-name-input').value = savedName;
        }
        
        function saveUser() {
            const name = document.getElementById('user-name-input').value || 'Anonymous';
            localStorage.setItem('userName', name);
            document.getElementById('user-name').textContent = name;
            document.getElementById('user-panel').style.display = 'none';
        }
        
        function refreshAll() {
            const iframes = document.querySelectorAll('.system-iframe');
            iframes.forEach(iframe => {
                iframe.src = iframe.src;
            });
        }
        
        function openAll() {
            window.open('http://localhost:4040', '_blank');
            window.open('http://localhost:3003', '_blank');
            window.open('http://localhost:5055', '_blank');
        }
        
        async function checkStatus() {
            const systems = [
                { name: 'Cal Dashboard', port: 4040 },
                { name: 'AI Economy', port: 3003 },
                { name: 'Domingo Economy', port: 5055 }
            ];
            
            let status = 'System Status:\\n\\n';
            
            for (const system of systems) {
                try {
                    const response = await fetch(\`http://localhost:\${system.port}\`, { 
                        method: 'HEAD',
                        mode: 'no-cors'
                    });
                    status += \`✅ \${system.name}: WORKING\\n\`;
                } catch (error) {
                    status += \`❌ \${system.name}: NOT WORKING\\n\`;
                }
            }
            
            alert(status);
        }
        
        // Auto-refresh status indicators
        setInterval(async () => {
            const indicators = document.querySelectorAll('.status-indicator');
            const ports = [4040, 3003, 5055];
            
            for (let i = 0; i < ports.length; i++) {
                try {
                    await fetch(\`http://localhost:\${ports[i]}\`, { 
                        method: 'HEAD',
                        mode: 'no-cors'
                    });
                    indicators[i].className = 'status-indicator status-online';
                    indicators[i].textContent = '● WORKING';
                } catch (error) {
                    indicators[i].className = 'status-indicator status-offline';
                    indicators[i].textContent = '● OFFLINE';
                }
            }
        }, 10000); // Check every 10 seconds
        
        // Track user activity
        fetch('/api/user-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: userId, 
                userName: savedName,
                action: 'dashboard_load',
                timestamp: new Date().toISOString()
            })
        }).catch(e => console.log('Activity tracking failed'));
        
        console.log('🚀 Unified Dashboard loaded');
        console.log('User ID:', userId);
        console.log('Connected to existing working systems');
    </script>
</body>
</html>`);
});

// API to track user activity
app.post('/api/user-activity', (req, res) => {
    const { userId, userName, action, timestamp } = req.body;
    
    if (!users.has(userId)) {
        users.set(userId, {
            id: userId,
            name: userName,
            firstSeen: timestamp,
            actions: []
        });
    }
    
    const user = users.get(userId);
    user.actions.push({ action, timestamp });
    user.lastSeen = timestamp;
    
    console.log(`📊 User Activity: ${userName} (${userId}) - ${action}`);
    
    res.json({ success: true });
});

// API to get user stats
app.get('/api/users', (req, res) => {
    const userList = Array.from(users.values()).map(user => ({
        id: user.id,
        name: user.name,
        actionsCount: user.actions.length,
        lastSeen: user.lastSeen
    }));
    
    res.json(userList);
});

// API to check system status
app.get('/api/status', (req, res) => {
    res.json({
        dashboard: 'operational',
        activeUsers: users.size,
        connectedSystems: {
            cal: 'http://localhost:4040',
            economy: 'http://localhost:3003', 
            domingo: 'http://localhost:5055'
        },
        uptime: Date.now()
    });
});

// Proxy endpoints to connect systems
app.post('/api/cal-reflect', async (req, res) => {
    try {
        const response = await fetch('http://localhost:4040/api/reflect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.json({ error: 'Cal system not available', fallback: true });
    }
});

app.post('/api/economy-contribute', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3003/contribute', {
            method: 'POST'
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.json({ error: 'Economy system not available', fallback: true });
    }
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               UNIFIED WORKING DASHBOARD                      ║
║                                                              ║
║  ✅ Uses your EXISTING working systems                       ║
║  ✅ No new systems that timeout                              ║
║  ✅ Multi-user tracking                                      ║
║  ✅ Real iframe integration                                  ║
║                                                              ║
║  🌐 Dashboard: http://localhost:${PORT}                      ║
║                                                              ║
║  Connected Systems:                                          ║
║  🧠 Cal Dashboard: http://localhost:4040                     ║
║  🎮 AI Economy: http://localhost:3003                        ║
║  💰 Domingo: http://localhost:5055                           ║
║                                                              ║
║  NOTE: Start those systems first, then access this          ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    console.log(`✅ Unified dashboard operational`);
    console.log(`✅ Multi-user support enabled`);
    console.log(`✅ Connects to existing working systems`);
    console.log(`✅ No new dependencies or timeouts`);
});

module.exports = app;