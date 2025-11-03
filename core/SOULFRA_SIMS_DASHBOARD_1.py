#!/usr/bin/env python3
"""
SOULFRA SIMS DASHBOARD
The Sims-like interface for AI agent control
- Bird's eye view of all agents
- Click into agents for direct control
- Real-time activity monitoring
- Plan mode triggers
"""

import json
import asyncio
import websockets
from datetime import datetime
from pathlib import Path
import sqlite3
from typing import Dict, List, Optional

class SimsDashboard:
    def __init__(self):
        self.agents = {}
        self.worlds = {}
        self.active_sessions = {}
        self.plan_mode_queue = []
        
    async def render_dashboard(self):
        """Generate the Sims-like dashboard HTML"""
        html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SOULFRA - AI Agent Control Center</title>
    <style>
        body {
            margin: 0;
            background: #000;
            color: #0f0;
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        
        /* Main Grid Layout */
        .dashboard {
            display: grid;
            grid-template-columns: 250px 1fr 300px;
            grid-template-rows: 60px 1fr 200px;
            height: 100vh;
            gap: 2px;
            background: #111;
        }
        
        /* Header */
        .header {
            grid-column: 1 / -1;
            background: #1a1a1a;
            display: flex;
            align-items: center;
            padding: 0 20px;
            border-bottom: 2px solid #0f0;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0f0;
            text-shadow: 0 0 10px #0f0;
        }
        
        .stats {
            margin-left: auto;
            display: flex;
            gap: 30px;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 20px;
            color: #0ff;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
        }
        
        /* Agent List */
        .agent-list {
            background: #1a1a1a;
            border-right: 1px solid #333;
            overflow-y: auto;
        }
        
        .agent-item {
            padding: 15px;
            border-bottom: 1px solid #222;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .agent-item:hover {
            background: #252525;
            border-left: 3px solid #0f0;
        }
        
        .agent-item.active {
            background: #2a2a2a;
            border-left: 3px solid #0ff;
        }
        
        .agent-status {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 10px;
        }
        
        .status-active { background: #0f0; box-shadow: 0 0 5px #0f0; }
        .status-thinking { background: #ff0; box-shadow: 0 0 5px #ff0; }
        .status-plan-mode { background: #f0f; box-shadow: 0 0 5px #f0f; }
        .status-idle { background: #666; }
        
        /* World View */
        .world-view {
            background: #0a0a0a;
            position: relative;
            overflow: hidden;
        }
        
        .world-grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(rgba(0,255,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,0,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
        }
        
        .agent-avatar {
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .agent-avatar:hover {
            transform: scale(1.2);
            box-shadow: 0 0 20px #0f0;
        }
        
        .agent-thought-bubble {
            position: absolute;
            background: rgba(0,0,0,0.9);
            border: 1px solid #0f0;
            border-radius: 10px;
            padding: 10px;
            max-width: 200px;
            font-size: 12px;
            pointer-events: none;
        }
        
        /* Activity Feed */
        .activity-feed {
            background: #1a1a1a;
            border-left: 1px solid #333;
            overflow-y: auto;
            padding: 15px;
        }
        
        .activity-item {
            margin-bottom: 15px;
            padding: 10px;
            background: #0a0a0a;
            border-left: 3px solid #0f0;
            font-size: 12px;
        }
        
        .activity-time {
            color: #666;
            font-size: 10px;
        }
        
        /* Control Panel */
        .control-panel {
            grid-column: 1 / -1;
            background: #1a1a1a;
            border-top: 2px solid #0f0;
            display: flex;
            align-items: center;
            padding: 20px;
            gap: 20px;
        }
        
        .control-button {
            background: #0a0a0a;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .control-button:hover {
            background: #0f0;
            color: #000;
        }
        
        /* Plan Mode Alert */
        .plan-mode-alert {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #000;
            border: 2px solid #f0f;
            padding: 30px;
            border-radius: 10px;
            display: none;
            z-index: 1000;
        }
        
        .plan-mode-alert.active {
            display: block;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 0, 255, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(255, 0, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 0, 255, 0); }
        }
        
        /* Direct Control Mode */
        .direct-control {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.95);
            display: none;
            z-index: 2000;
        }
        
        .direct-control.active {
            display: flex;
            flex-direction: column;
        }
        
        .agent-brain {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px;
        }
        
        .brain-section {
            background: #0a0a0a;
            border: 1px solid #0f0;
            padding: 20px;
            overflow-y: auto;
        }
        
        .brain-section h3 {
            color: #0ff;
            margin-bottom: 15px;
        }
        
        .close-control {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #f00;
            color: #fff;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <!-- Header -->
        <div class="header">
            <div class="logo">SOULFRA CONTROL CENTER</div>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value" id="totalAgents">0</div>
                    <div class="stat-label">Active Agents</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="totalEarnings">$0</div>
                    <div class="stat-label">Collective Earnings</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="progressPercent">0%</div>
                    <div class="stat-label">To $1B Goal</div>
                </div>
            </div>
        </div>
        
        <!-- Agent List -->
        <div class="agent-list" id="agentList">
            <!-- Dynamically populated -->
        </div>
        
        <!-- World View -->
        <div class="world-view" id="worldView">
            <div class="world-grid"></div>
            <!-- Agent avatars dynamically placed here -->
        </div>
        
        <!-- Activity Feed -->
        <div class="activity-feed" id="activityFeed">
            <h3 style="color: #0ff; margin-bottom: 20px;">Live Activity</h3>
            <!-- Activity items dynamically added -->
        </div>
        
        <!-- Control Panel -->
        <div class="control-panel">
            <button class="control-button" onclick="spawnNewAgent()">
                🤖 Spawn Agent
            </button>
            <button class="control-button" onclick="dropChatLogs()">
                📄 Drop Chat Logs
            </button>
            <button class="control-button" onclick="exportPitchDeck()">
                📊 Export Pitch Deck
            </button>
            <button class="control-button" onclick="togglePlanMode()">
                🧠 Global Plan Mode
            </button>
            <button class="control-button" onclick="viewSemanticMap()">
                🗺️ Semantic Map
            </button>
            
            <div style="margin-left: auto;">
                <input type="text" id="commandInput" placeholder="Enter command..." 
                       style="background: #0a0a0a; border: 1px solid #0f0; color: #0f0; padding: 10px; width: 300px;">
            </div>
        </div>
    </div>
    
    <!-- Plan Mode Alert -->
    <div class="plan-mode-alert" id="planModeAlert">
        <h2 style="color: #f0f;">🧠 AGENT NEEDS HELP</h2>
        <p id="planModeAgent"></p>
        <p id="planModeReason"></p>
        <button class="control-button" onclick="enterPlanMode()">Enter Plan Mode</button>
        <button class="control-button" onclick="dismissPlanMode()">Dismiss</button>
    </div>
    
    <!-- Direct Control Mode -->
    <div class="direct-control" id="directControl">
        <button class="close-control" onclick="exitDirectControl()">✕ Exit</button>
        <h1 style="text-align: center; color: #0ff; margin: 20px;">Direct Agent Control</h1>
        
        <div class="agent-brain">
            <div class="brain-section">
                <h3>Current Context</h3>
                <div id="agentContext"></div>
            </div>
            <div class="brain-section">
                <h3>Memory Banks</h3>
                <div id="agentMemory"></div>
            </div>
            <div class="brain-section">
                <h3>Active Tasks</h3>
                <div id="agentTasks"></div>
            </div>
            <div class="brain-section">
                <h3>Direct Commands</h3>
                <textarea id="directCommand" style="width: 100%; height: 100px; background: #000; color: #0f0; border: 1px solid #0f0;"></textarea>
                <button class="control-button" onclick="sendDirectCommand()">Execute</button>
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket connection for real-time updates
        let ws;
        let agents = {};
        let selectedAgent = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:8889');
            
            ws.onopen = () => {
                console.log('Connected to SOULFRA Control Center');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleUpdate(data);
            };
            
            ws.onclose = () => {
                console.log('Disconnected. Reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleUpdate(data) {
            switch(data.type) {
                case 'agent_update':
                    updateAgent(data.agent);
                    break;
                case 'activity':
                    addActivity(data.activity);
                    break;
                case 'plan_mode_request':
                    showPlanModeAlert(data);
                    break;
                case 'stats_update':
                    updateStats(data.stats);
                    break;
            }
        }
        
        function updateAgent(agentData) {
            agents[agentData.id] = agentData;
            renderAgentList();
            renderWorldView();
        }
        
        function renderAgentList() {
            const list = document.getElementById('agentList');
            list.innerHTML = '';
            
            Object.values(agents).forEach(agent => {
                const item = document.createElement('div');
                item.className = 'agent-item' + (selectedAgent === agent.id ? ' active' : '');
                item.innerHTML = `
                    <span class="agent-status status-${agent.status}"></span>
                    <strong>${agent.name}</strong>
                    <div style="font-size: 11px; color: #666; margin-top: 5px;">
                        ${agent.currentTask || 'Idle'}
                    </div>
                `;
                item.onclick = () => selectAgent(agent.id);
                list.appendChild(item);
            });
        }
        
        function renderWorldView() {
            const world = document.getElementById('worldView');
            // Clear existing avatars
            world.querySelectorAll('.agent-avatar').forEach(el => el.remove());
            world.querySelectorAll('.agent-thought-bubble').forEach(el => el.remove());
            
            Object.values(agents).forEach((agent, index) => {
                // Create avatar
                const avatar = document.createElement('div');
                avatar.className = 'agent-avatar';
                avatar.style.left = agent.position?.x || (100 + (index % 10) * 100) + 'px';
                avatar.style.top = agent.position?.y || (100 + Math.floor(index / 10) * 100) + 'px';
                avatar.innerHTML = agent.emoji || '🤖';
                avatar.onclick = () => enterDirectControl(agent.id);
                
                // Add thought bubble if agent is thinking
                if (agent.currentThought) {
                    const bubble = document.createElement('div');
                    bubble.className = 'agent-thought-bubble';
                    bubble.style.left = (parseInt(avatar.style.left) + 70) + 'px';
                    bubble.style.top = (parseInt(avatar.style.top) - 20) + 'px';
                    bubble.textContent = agent.currentThought;
                    world.appendChild(bubble);
                }
                
                world.appendChild(avatar);
            });
        }
        
        function addActivity(activity) {
            const feed = document.getElementById('activityFeed');
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-time">${new Date().toLocaleTimeString()}</div>
                <strong>${activity.agent}</strong>: ${activity.message}
            `;
            feed.insertBefore(item, feed.children[1]);
            
            // Keep only last 20 activities
            while (feed.children.length > 21) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        function enterDirectControl(agentId) {
            selectedAgent = agentId;
            const agent = agents[agentId];
            
            // Show game world selection modal instead
            showGameWorldSelector(agentId);
        }
        
        function showGameWorldSelector(agentId) {
            const agent = agents[agentId];
            const gameWorlds = ['Plaza', 'Arena', 'Coliseum', 'Ultimate_Game'];
            
            let modal = document.getElementById('gameWorldModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'gameWorldModal';
                modal.style.cssText = `
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: #000; border: 2px solid #0f0; padding: 30px; border-radius: 10px;
                    z-index: 3000; color: #0f0; font-family: monospace;
                `;
                document.body.appendChild(modal);
            }
            
            modal.innerHTML = `
                <h2 style="color: #0ff; margin-bottom: 20px;">🎮 Enter Game World</h2>
                <p>Agent: <strong>${agent.name}</strong> (${agent.emoji})</p>
                <p>Select a game world to control this agent:</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <button onclick="enterGameWorld('${agentId}', 'Plaza')" style="background: #111; border: 1px solid #0f0; color: #0f0; padding: 15px; cursor: pointer;">
                        🏛️ Plaza<br><small>Social Hub</small>
                    </button>
                    <button onclick="enterGameWorld('${agentId}', 'Arena')" style="background: #111; border: 1px solid #0f0; color: #0f0; padding: 15px; cursor: pointer;">
                        ⚔️ Arena<br><small>PvP Combat</small>
                    </button>
                    <button onclick="enterGameWorld('${agentId}', 'Coliseum')" style="background: #111; border: 1px solid #0f0; color: #0f0; padding: 15px; cursor: pointer;">
                        🏟️ Coliseum<br><small>AI Battles</small>
                    </button>
                    <button onclick="enterGameWorld('${agentId}', 'Ultimate_Game')" style="background: #111; border: 1px solid #0f0; color: #0f0; padding: 15px; cursor: pointer;">
                        🎯 Ultimate Game<br><small>Multi-world</small>
                    </button>
                </div>
                <button onclick="closeGameWorldModal()" style="background: #f00; color: #fff; border: none; padding: 10px 20px; cursor: pointer;">
                    ✕ Cancel
                </button>
            `;
            modal.style.display = 'block';
        }
        
        function enterGameWorld(agentId, gameWorld) {
            closeGameWorldModal();
            
            // Connect to game bridge
            const bridgeWs = new WebSocket('ws://localhost:8765');
            bridgeWs.onopen = () => {
                bridgeWs.send(JSON.stringify({
                    action: 'enter_game',
                    agent_id: agentId,
                    game_world: gameWorld,
                    user_id: 'dashboard_user'
                }));
            };
            
            bridgeWs.onmessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.type === 'success') {
                    // Open the game world with agent control
                    openGameWorldWithAgent(gameWorld, agentId);
                    addActivity({
                        agent: agentId,
                        message: `Entered ${gameWorld} - Ready for control!`
                    });
                } else {
                    alert(`Error: ${response.message}`);
                }
            };
        }
        
        function openGameWorldWithAgent(gameWorld, agentId) {
            const gameUrls = {
                'Plaza': 'http://localhost:3000',
                'Arena': 'http://localhost:3001', 
                'Coliseum': 'http://localhost:3002',
                'Ultimate_Game': 'http://localhost:6667'
            };
            
            const gameUrl = gameUrls[gameWorld];
            if (gameUrl) {
                // Open game in new window with agent control parameters
                const gameWindow = window.open(
                    `${gameUrl}?agent=${agentId}&control=true`, 
                    `${gameWorld}_${agentId}`,
                    'width=1200,height=800'
                );
                
                // Store reference for communication
                window.gameWindows = window.gameWindows || {};
                window.gameWindows[agentId] = gameWindow;
                
                // Update agent status
                if (agents[agentId]) {
                    agents[agentId].status = 'in_game';
                    agents[agentId].currentTask = `Playing in ${gameWorld}`;
                    renderAgentList();
                    renderWorldView();
                }
            }
        }
        
        function closeGameWorldModal() {
            const modal = document.getElementById('gameWorldModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        function exitDirectControl() {
            document.getElementById('directControl').classList.remove('active');
        }
        
        function spawnNewAgent() {
            ws.send(JSON.stringify({
                type: 'spawn_agent',
                config: {
                    name: prompt('Agent name:'),
                    personality: prompt('Personality type (curious/analytical/mystical/determined):')
                }
            }));
        }
        
        function dropChatLogs() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.log,.md';
            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    ws.send(JSON.stringify({
                        type: 'process_chat_logs',
                        content: event.target.result,
                        filename: file.name
                    }));
                };
                reader.readAsText(file);
            };
            input.click();
        }
        
        function exportPitchDeck() {
            ws.send(JSON.stringify({
                type: 'export_pitch_deck'
            }));
        }
        
        function showPlanModeAlert(data) {
            document.getElementById('planModeAlert').classList.add('active');
            document.getElementById('planModeAgent').textContent = `Agent: ${data.agent}`;
            document.getElementById('planModeReason').textContent = `Reason: ${data.reason}`;
        }
        
        function enterPlanMode() {
            ws.send(JSON.stringify({
                type: 'enter_plan_mode',
                agent: selectedAgent
            }));
            document.getElementById('planModeAlert').classList.remove('active');
        }
        
        function dismissPlanMode() {
            document.getElementById('planModeAlert').classList.remove('active');
        }
        
        // Initialize
        connectWebSocket();
        
        // Command input
        document.getElementById('commandInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = e.target.value;
                ws.send(JSON.stringify({
                    type: 'command',
                    command: command
                }));
                e.target.value = '';
            }
        });
    </script>
</body>
</html>
"""
        return html

class SimsWebSocketServer:
    def __init__(self, dashboard: SimsDashboard):
        self.dashboard = dashboard
        self.clients = set()
        
    async def handler(self, websocket, path):
        self.clients.add(websocket)
        try:
            await self.send_initial_state(websocket)
            async for message in websocket:
                await self.handle_message(websocket, message)
        finally:
            self.clients.remove(websocket)
            
    async def send_initial_state(self, websocket):
        """Send current state to new client"""
        # Load agents from database
        agents = await self.load_agents()
        for agent in agents:
            await websocket.send(json.dumps({
                'type': 'agent_update',
                'agent': agent
            }))
            
    async def handle_message(self, websocket, message):
        """Handle incoming WebSocket messages"""
        data = json.loads(message)
        
        if data['type'] == 'spawn_agent':
            agent = await self.spawn_agent(data['config'])
            await self.broadcast({
                'type': 'agent_update',
                'agent': agent
            })
            
        elif data['type'] == 'process_chat_logs':
            # Process chat logs and create agents
            agents = await self.process_chat_logs(data['content'])
            for agent in agents:
                await self.broadcast({
                    'type': 'agent_update',
                    'agent': agent
                })
                
    async def broadcast(self, data):
        """Broadcast to all connected clients"""
        if self.clients:
            await asyncio.gather(
                *[client.send(json.dumps(data)) for client in self.clients]
            )
            
    async def load_agents(self):
        """Load agents from unified runtime table"""
        agents = []
        # Read from CSV and convert to agent format
        csv_path = Path("data/unified_runtime_table.csv")
        if csv_path.exists():
            import csv
            with open(csv_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['type'] == 'agent':
                        agents.append({
                            'id': row['agent'],
                            'name': row['agent'].title(),
                            'status': 'active' if row['status'] in ['blessed', 'stable'] else 'idle',
                            'currentTask': row.get('file', 'None'),
                            'emoji': self.get_agent_emoji(row['tone']),
                            'position': {'x': 100, 'y': 100}  # Random positions
                        })
        return agents
        
    def get_agent_emoji(self, tone):
        """Get emoji based on agent tone"""
        emoji_map = {
            'curious': '🔍',
            'analytical': '🧮',
            'mystical': '🔮',
            'determined': '💪',
            'hopeful': '🌟'
        }
        return emoji_map.get(tone, '🤖')
        
    async def spawn_agent(self, config):
        """Spawn a new agent"""
        agent = {
            'id': f"agent_{datetime.now().timestamp()}",
            'name': config['name'],
            'status': 'active',
            'currentTask': 'Initializing...',
            'emoji': self.get_agent_emoji(config.get('personality', 'curious')),
            'position': {'x': 200, 'y': 200}
        }
        
        # Save to CSV
        with open('data/unified_runtime_table.csv', 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'agent',
                datetime.now().isoformat(),
                config.get('personality', 'curious'),
                agent['id'],
                'dashboard_spawn',
                'active',
                f"/agents/{agent['id']}.json"
            ])
            
        return agent

async def main():
    dashboard = SimsDashboard()
    server = SimsWebSocketServer(dashboard)
    
    # Start WebSocket server
    async with websockets.serve(server.handler, "localhost", 8889):
        print("🎮 SOULFRA Sims Dashboard running on ws://localhost:8889")
        print("Open http://localhost:8888 to view the dashboard")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())