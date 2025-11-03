#!/usr/bin/env python3
"""
SIMPLE SIMS DASHBOARD - Agent control interface without websockets
Click agents → Enter game worlds → Control agents
"""

import json
import csv
import http.server
import socketserver
from datetime import datetime
from pathlib import Path

PORT = 8890

class SimpleDashboardHandler(http.server.BaseHTTPRequestHandler):
    """Simple HTTP-based dashboard"""
    
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            
            # Load agents from runtime table
            agents = self.load_agents()
            
            html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SOULFRA - Agent Control Center</title>
    <style>
        body {{
            margin: 0;
            background: #000;
            color: #0f0;
            font-family: 'Courier New', monospace;
            padding: 20px;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 40px;
        }}
        
        .logo {{
            font-size: 48px;
            color: #0f0;
            text-shadow: 0 0 20px #0f0;
        }}
        
        .agent-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        .agent-card {{
            background: #111;
            border: 2px solid #0f0;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
        }}
        
        .agent-card:hover {{
            transform: scale(1.05);
            box-shadow: 0 0 30px #0f0;
            border-color: #0ff;
        }}
        
        .agent-emoji {{
            font-size: 48px;
            margin-bottom: 10px;
        }}
        
        .agent-name {{
            font-size: 24px;
            color: #0ff;
            margin-bottom: 5px;
        }}
        
        .agent-tone {{
            color: #666;
            margin-bottom: 15px;
        }}
        
        .game-buttons {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 15px;
        }}
        
        .game-btn {{
            background: #222;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px;
            cursor: pointer;
            border-radius: 5px;
            font-size: 12px;
            transition: all 0.2s;
        }}
        
        .game-btn:hover {{
            background: #0f0;
            color: #000;
        }}
        
        .instructions {{
            text-align: center;
            margin-top: 40px;
            color: #666;
        }}
        
        .status {{
            position: fixed;
            top: 20px;
            right: 20px;
            background: #111;
            border: 1px solid #0f0;
            padding: 15px;
            border-radius: 10px;
        }}
    </style>
</head>
<body>
    <div class="status">
        <strong>🌉 Bridge Status</strong><br>
        <span id="bridgeStatus">Checking...</span>
    </div>

    <div class="header">
        <h1 class="logo">🎮 SOULFRA AGENT CONTROL</h1>
        <p style="font-size: 18px; color: #0ff;">Click any agent to send them into a game world!</p>
    </div>
    
    <div class="agent-grid">
{''.join([f'''
        <div class="agent-card" onclick="showGameSelector('{agent['id']}', '{agent['tone']}')">
            <div class="agent-emoji">{self.get_agent_emoji(agent['tone'])}</div>
            <div class="agent-name">{agent['id'].title()}</div>
            <div class="agent-tone">{agent['tone'].upper()} AGENT</div>
            <div style="color: #0f0; font-size: 12px;">Click to control</div>
            
            <div class="game-buttons">
                <button class="game-btn" onclick="event.stopPropagation(); enterGameDirect('{agent['id']}', 'Ultimate_Game')">
                    🎯 Ultimate Game
                </button>
                <button class="game-btn" onclick="event.stopPropagation(); enterGameDirect('{agent['id']}', 'Plaza')">
                    🏛️ Plaza
                </button>
                <button class="game-btn" onclick="event.stopPropagation(); enterGameDirect('{agent['id']}', 'Arena')">
                    ⚔️ Arena
                </button>
                <button class="game-btn" onclick="event.stopPropagation(); enterGameDirect('{agent['id']}', 'Coliseum')">
                    🏟️ Coliseum
                </button>
            </div>
        </div>
''' for agent in agents])}
    </div>
    
    <div class="instructions">
        <h3>🎮 How to Control Agents</h3>
        <p>1. Click any game button to send that agent into the world</p>
        <p>2. The game will open in a new window with the agent auto-playing</p>
        <p>3. Watch your agent behave according to their personality!</p>
        <p>4. Each agent type has different behaviors:</p>
        <ul style="text-align: left; display: inline-block;">
            <li><strong>Curious</strong> - Explores and investigates</li>
            <li><strong>Analytical</strong> - Strategic and calculated</li>
            <li><strong>Mystical</strong> - Magical and unpredictable</li>
            <li><strong>Determined</strong> - Aggressive and persistent</li>
            <li><strong>Hopeful</strong> - Supportive and defensive</li>
        </ul>
    </div>
    
    <script>
        function showGameSelector(agentId, tone) {{
            alert(`Agent ${{agentId}} (${{tone}}) ready for game world assignment!\\n\\nClick one of the game buttons to send them into action.`);
        }}
        
        function enterGameDirect(agentId, gameWorld) {{
            console.log(`Sending agent ${{agentId}} to ${{gameWorld}}`);
            
            // Notify bridge
            fetch('http://localhost:8777/api/enter-game', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{
                    agent_id: agentId,
                    game_world: gameWorld,
                    user_id: 'dashboard_user'
                }})
            }})
            .then(response => response.json())
            .then(data => {{
                if (data.type === 'success') {{
                    console.log('Agent entered game successfully');
                }}
            }})
            .catch(error => {{
                console.log('Bridge not available, opening game anyway');
            }});
            
            // Open game world with agent control
            const gameUrls = {{
                'Plaza': 'http://localhost:3000',
                'Arena': 'http://localhost:3001', 
                'Coliseum': 'http://localhost:3002',
                'Ultimate_Game': 'http://localhost:8088'
            }};
            
            const gameUrl = gameUrls[gameWorld];
            if (gameUrl) {{
                const gameWindow = window.open(
                    `${{gameUrl}}?agent=${{agentId}}&control=true`, 
                    `${{gameWorld}}_${{agentId}}`,
                    'width=1200,height=800'
                );
                
                alert(`🎮 ${{agentId}} is now playing in ${{gameWorld}}!\\n\\nWatch them in the new window.`);
            }}
        }}
        
        // Check bridge status
        function checkBridgeStatus() {{
            fetch('http://localhost:8777/api/agents')
                .then(response => response.json())
                .then(data => {{
                    document.getElementById('bridgeStatus').innerHTML = '✅ Connected<br>' + data.agents.length + ' agents ready';
                }})
                .catch(error => {{
                    document.getElementById('bridgeStatus').innerHTML = '⚠️ Bridge Offline<br>Games still work';
                }});
        }}
        
        // Check status every 5 seconds
        setInterval(checkBridgeStatus, 5000);
        checkBridgeStatus();
    </script>
</body>
</html>
            '''
            self.wfile.write(html.encode('utf-8'))
            
        else:
            self.send_error(404)
            
    def load_agents(self):
        """Load agents from unified runtime table"""
        agents = []
        try:
            with open('data/unified_runtime_table.csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['type'] == 'agent' and row['status'] in ['stable', 'active']:
                        agents.append({
                            'id': row['agent'],
                            'tone': row['tone'],
                            'status': row['status']
                        })
        except Exception as e:
            print(f"Could not load agents: {e}")
            # Create sample agents
            agents = [
                {'id': 'echofox', 'tone': 'curious', 'status': 'active'},
                {'id': 'cal', 'tone': 'mystical', 'status': 'active'},
                {'id': 'quantum_navigator', 'tone': 'analytical', 'status': 'active'}
            ]
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
        
    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == "__main__":
    print("🎮 SIMPLE SIMS DASHBOARD STARTED")
    print("=" * 50)
    print(f"🌐 Agent Control Dashboard: http://localhost:{PORT}")
    print("🎯 Click agents → Send to game worlds")
    print("🤖 Agents will auto-play based on their personality")
    
    with socketserver.TCPServer(("", PORT), SimpleDashboardHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Dashboard shutting down...")