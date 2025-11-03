#!/usr/bin/env python3
"""
SIMPLE GAME AGENT BRIDGE - No websockets required
Connects agents to game worlds using HTTP API
"""

import json
import csv
import http.server
import socketserver
from datetime import datetime
from pathlib import Path
import threading
import time

PORT = 8777

class GameAgentBridge:
    """Simple HTTP-based bridge between runtime agents and game worlds"""
    
    def __init__(self):
        self.active_agents = {}
        self.game_sessions = {}
        self.agent_locations = {}
        self.control_sessions = {}
        
        # Load agents from runtime table
        self.load_runtime_agents()
        
    def load_runtime_agents(self):
        """Load all active agents from unified runtime table"""
        try:
            with open('data/unified_runtime_table.csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['type'] == 'agent' and row['status'] in ['stable', 'active']:
                        agent_id = row['agent']
                        self.active_agents[agent_id] = {
                            'id': agent_id,
                            'tone': row['tone'],
                            'source': row['source'],
                            'status': 'available',
                            'current_game': None,
                            'controlled_by': None,
                            'last_activity': row['timestamp'],
                            'capabilities': self.determine_agent_capabilities(row['tone'])
                        }
                        
            print(f"✅ Loaded {len(self.active_agents)} active agents from runtime table")
            
        except Exception as e:
            print(f"⚠️  Could not load runtime agents: {e}")
            # Create sample agents for testing
            self.create_sample_agents()
            
    def determine_agent_capabilities(self, tone):
        """Determine what an agent can do based on its tone"""
        capabilities = {
            'curious': ['explore', 'investigate', 'learn'],
            'analytical': ['strategize', 'calculate', 'optimize'],
            'mystical': ['divine', 'enchant', 'predict'],
            'determined': ['fight', 'persist', 'achieve'],
            'hopeful': ['inspire', 'heal', 'support']
        }
        return capabilities.get(tone, ['basic_actions'])
        
    def create_sample_agents(self):
        """Create sample agents for testing if none found"""
        sample_agents = [
            {'id': 'echofox', 'tone': 'curious'},
            {'id': 'cal', 'tone': 'mystical'}, 
            {'id': 'quantum_navigator', 'tone': 'analytical'}
        ]
        
        for agent_data in sample_agents:
            self.active_agents[agent_data['id']] = {
                'id': agent_data['id'],
                'tone': agent_data['tone'],
                'status': 'available',
                'current_game': None,
                'controlled_by': None,
                'capabilities': self.determine_agent_capabilities(agent_data['tone'])
            }
            
    def agent_enter_game(self, agent_id, game_world, user_id):
        """Move an agent into a specific game world"""
        if agent_id not in self.active_agents:
            return {'type': 'error', 'message': f'Agent {agent_id} not found'}
            
        agent = self.active_agents[agent_id]
        
        if agent['status'] != 'available':
            return {'type': 'error', 'message': f'Agent {agent_id} is not available'}
            
        # Move agent to game world
        agent['current_game'] = game_world
        agent['controlled_by'] = user_id
        agent['status'] = 'in_game'
        
        self.agent_locations[agent_id] = game_world
        self.control_sessions[user_id] = agent_id
        
        return {
            'type': 'success',
            'message': f'Agent {agent_id} entered {game_world}',
            'agent': agent
        }
        
    def get_dashboard_data(self):
        """Get data for the Sims-like dashboard"""
        return {
            'total_agents': len(self.active_agents),
            'available_agents': len([a for a in self.active_agents.values() if a['status'] == 'available']),
            'agents_in_games': len([a for a in self.active_agents.values() if a['status'] == 'in_game']),
            'active_sessions': len(self.control_sessions),
            'agents': list(self.active_agents.values()),
            'game_worlds': ['Plaza', 'Arena', 'Coliseum', 'Ultimate_Game'],
            'recent_activity': self.get_recent_activity()
        }
        
    def get_recent_activity(self):
        """Get recent agent activity for dashboard"""
        activities = []
        for agent_id, agent in self.active_agents.items():
            if agent['current_game']:
                activities.append({
                    'agent_id': agent_id,
                    'action': f"Active in {agent['current_game']}",
                    'timestamp': datetime.now().isoformat()
                })
        return activities[-10:]  # Last 10 activities

class BridgeHandler(http.server.BaseHTTPRequestHandler):
    """HTTP handler for the bridge API"""
    
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Game Agent Bridge</title>
    <style>
        body {{ background: #000; color: #0f0; font-family: monospace; padding: 20px; }}
        .agent {{ background: #111; border: 1px solid #0f0; margin: 10px 0; padding: 15px; }}
        .status {{ color: #0ff; }}
    </style>
</head>
<body>
    <h1>🌉 Game Agent Bridge Status</h1>
    <p>Bridge connecting {len(bridge.active_agents)} agents to game worlds</p>
    
    <h2>Active Agents:</h2>
    {''.join([f'<div class="agent"><strong>{agent["id"]}</strong> - {agent["tone"]} - <span class="status">{agent["status"]}</span></div>' for agent in bridge.active_agents.values()])}
    
    <h2>API Endpoints:</h2>
    <ul>
        <li>GET /api/agents - List all agents</li>
        <li>POST /api/enter-game - Enter agent into game world</li>
        <li>GET /api/dashboard - Dashboard data</li>
    </ul>
</body>
</html>
            '''
            self.wfile.write(html.encode('utf-8'))
            
        elif self.path == '/api/agents':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'agents': [agent for agent in bridge.active_agents.values() 
                          if agent['status'] == 'available']
            }).encode())
            
        elif self.path == '/api/dashboard':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(bridge.get_dashboard_data()).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/enter-game':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            result = bridge.agent_enter_game(
                data.get('agent_id'),
                data.get('game_world'),
                data.get('user_id', 'dashboard_user')
            )
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        pass  # Suppress logs

# Global bridge instance
bridge = GameAgentBridge()

if __name__ == "__main__":
    print("🌉 SIMPLE GAME AGENT BRIDGE STARTED")
    print("=" * 50)
    print(f"✅ {len(bridge.active_agents)} agents loaded and ready")
    print("🎮 Game worlds can now connect to agents")
    print(f"🌐 HTTP API running on http://localhost:{PORT}")
    print("📊 Dashboard available at /api/dashboard")
    print()
    print("Available agents:")
    for agent_id, agent in bridge.active_agents.items():
        print(f"  - {agent_id} ({agent['tone']}) - {', '.join(agent['capabilities'])}")
    
    with socketserver.TCPServer(("", PORT), BridgeHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Bridge shutting down...")