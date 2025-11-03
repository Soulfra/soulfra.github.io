#!/usr/bin/env python3
"""
GAME AGENT BRIDGE - The missing connection between agents and game worlds
This is what makes agents controllable in games rather than just abstract entities
"""

import json
import csv
import sqlite3
import asyncio
import websockets
from datetime import datetime
from pathlib import Path
import threading
import time

class GameAgentBridge:
    """Bridges the gap between runtime agents and game world control"""
    
    def __init__(self):
        self.active_agents = {}
        self.game_sessions = {}
        self.agent_locations = {}  # Which game world each agent is in
        self.control_sessions = {}  # User controlling which agent
        
        # Load agents from runtime table
        self.load_runtime_agents()
        
        # Start the bridge server
        self.start_bridge_server()
        
    def load_runtime_agents(self):
        """Load all active agents from unified runtime table"""
        try:
            with open('data/unified_runtime_table.csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['type'] == 'agent' and row['status'] == 'stable':
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
            
    def start_bridge_server(self):
        """Start WebSocket server for game-agent communication"""
        self.bridge_thread = threading.Thread(target=self.run_bridge_server, daemon=True)
        self.bridge_thread.start()
        
    def run_bridge_server(self):
        """Run the WebSocket bridge server"""
        async def bridge_handler(websocket, path):
            try:
                async for message in websocket:
                    data = json.loads(message)
                    response = await self.handle_bridge_message(data)
                    await websocket.send(json.dumps(response))
            except Exception as e:
                print(f"Bridge connection error: {e}")
                
        # Start WebSocket server on port 8765 for game bridge
        start_server = websockets.serve(bridge_handler, "localhost", 8765)
        
        # Run the server
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(start_server)
        loop.run_forever()
        
    async def handle_bridge_message(self, data):
        """Handle communication between games and agents"""
        action = data.get('action')
        
        if action == 'get_available_agents':
            return {
                'type': 'agent_list',
                'agents': [agent for agent in self.active_agents.values() 
                          if agent['status'] == 'available']
            }
            
        elif action == 'enter_game':
            agent_id = data.get('agent_id')
            game_world = data.get('game_world')
            user_id = data.get('user_id')
            
            return self.agent_enter_game(agent_id, game_world, user_id)
            
        elif action == 'control_agent':
            agent_id = data.get('agent_id')
            user_command = data.get('command')
            
            return self.execute_agent_command(agent_id, user_command)
            
        elif action == 'get_agent_status':
            agent_id = data.get('agent_id')
            return self.get_agent_status(agent_id)
            
        return {'type': 'error', 'message': f'Unknown action: {action}'}
        
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
        
    def execute_agent_command(self, agent_id, command):
        """Execute a command for an agent in a game"""
        if agent_id not in self.active_agents:
            return {'type': 'error', 'message': f'Agent {agent_id} not found'}
            
        agent = self.active_agents[agent_id]
        
        if agent['status'] != 'in_game':
            return {'type': 'error', 'message': f'Agent {agent_id} is not in a game'}
            
        # Process command based on agent capabilities
        response = self.process_agent_command(agent, command)
        
        return {
            'type': 'command_result',
            'agent_id': agent_id,
            'command': command,
            'result': response
        }
        
    def process_agent_command(self, agent, command):
        """Process a command based on agent's tone and capabilities"""
        tone = agent['tone']
        capabilities = agent['capabilities']
        
        # Basic command interpretation based on agent type
        if 'move' in command.lower():
            if 'explore' in capabilities:
                return f"{agent['id']} explores the area with curiosity"
            elif 'fight' in capabilities:
                return f"{agent['id']} moves strategically into position"
            else:
                return f"{agent['id']} moves cautiously"
                
        elif 'attack' in command.lower():
            if 'fight' in capabilities:
                return f"{agent['id']} launches a determined attack!"
            elif 'enchant' in capabilities:
                return f"{agent['id']} casts a mystical spell!"
            else:
                return f"{agent['id']} makes a basic attack"
                
        elif 'interact' in command.lower():
            if 'investigate' in capabilities:
                return f"{agent['id']} carefully examines the object"
            elif 'heal' in capabilities:
                return f"{agent['id']} offers supportive energy"
            else:
                return f"{agent['id']} interacts with the object"
                
        else:
            return f"{agent['id']} ({tone}) responds: Understanding your intent..."
            
    def get_agent_status(self, agent_id):
        """Get current status of an agent"""
        if agent_id not in self.active_agents:
            return {'type': 'error', 'message': f'Agent {agent_id} not found'}
            
        return {
            'type': 'agent_status',
            'agent': self.active_agents[agent_id]
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

# Global bridge instance
bridge = GameAgentBridge()

def get_bridge():
    """Get the global bridge instance"""
    return bridge

if __name__ == "__main__":
    print("🌉 GAME AGENT BRIDGE STARTED")
    print("=" * 50)
    print(f"✅ {len(bridge.active_agents)} agents loaded and ready")
    print("🎮 Game worlds can now connect to agents")
    print("🎯 WebSocket bridge running on localhost:8765")
    print("📊 Dashboard data available via get_dashboard_data()")
    print()
    print("Available agents:")
    for agent_id, agent in bridge.active_agents.items():
        print(f"  - {agent_id} ({agent['tone']}) - {', '.join(agent['capabilities'])}")
    
    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 Bridge shutting down...")