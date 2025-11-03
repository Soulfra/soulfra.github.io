#!/usr/bin/env python3
"""
AI ECONOMY DASHBOARD
Real-time visualization of the autonomous agent marketplace
"""

import json
import sqlite3
import threading
import time
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import webbrowser

class EconomyDashboardServer:
    """Serves real-time economy data"""
    
    def __init__(self, port=8888):
        self.port = port
        self.db_path = 'ai_economy.db'
        
    def get_live_data(self):
        """Get current economy state"""
        try:
            db = sqlite3.connect(self.db_path)
            cursor = db.cursor()
            
            # Agent data
            cursor.execute('''
                SELECT agent_id, agent_name, balance, reputation, 
                       components_created, components_consumed
                FROM agent_wallets
                ORDER BY balance DESC
            ''')
            agents = []
            for row in cursor.fetchall():
                agents.append({
                    'id': row[0],
                    'name': row[1],
                    'balance': round(row[2], 2),
                    'reputation': round(row[3], 2),
                    'created': row[4],
                    'consumed': row[5]
                })
                
            # Recent whispers
            cursor.execute('''
                SELECT whisper_text, bounty, posted_by_agent, status, created_at
                FROM whisper_market
                ORDER BY created_at DESC
                LIMIT 10
            ''')
            whispers = []
            for row in cursor.fetchall():
                whispers.append({
                    'text': row[0],
                    'bounty': round(row[1], 2),
                    'posted_by': row[2],
                    'status': row[3],
                    'time': row[4]
                })
                
            # Recent trades
            cursor.execute('''
                SELECT t.amount, t.transaction_type, t.timestamp,
                       c.name as component_name
                FROM value_transactions t
                LEFT JOIN component_marketplace c ON t.component_id = c.component_id
                ORDER BY t.timestamp DESC
                LIMIT 10
            ''')
            trades = []
            for row in cursor.fetchall():
                trades.append({
                    'amount': round(row[0], 2),
                    'type': row[1],
                    'time': row[2],
                    'component': row[3] or 'N/A'
                })
                
            # Market stats
            cursor.execute('''
                SELECT COUNT(*) as total, AVG(price) as avg_price, SUM(usage_count) as usage
                FROM component_marketplace
                WHERE available = 1
            ''')
            market = cursor.fetchone()
            
            db.close()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'agents': agents,
                'whispers': whispers,
                'trades': trades,
                'market': {
                    'total_components': market[0] or 0,
                    'avg_price': round(market[1] or 0, 2),
                    'total_usage': market[2] or 0
                }
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            
    def create_dashboard_html(self):
        """Create the dashboard HTML"""
        return '''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra AI Economy Dashboard</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #0a0e1a;
            color: #fff;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #00ffff;
            text-shadow: 0 0 20px rgba(0,255,255,0.5);
            margin-bottom: 30px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .panel {
            background: rgba(255,255,255,0.05);
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
        }
        .panel h2 {
            color: #00ff00;
            margin-top: 0;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
        }
        .agent-card {
            background: rgba(0,255,0,0.1);
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            align-items: center;
        }
        .agent-name {
            font-weight: bold;
            color: #ffff00;
        }
        .balance {
            color: #00ff00;
            text-align: right;
        }
        .reputation {
            color: #ff00ff;
            text-align: center;
        }
        .stats {
            color: #00ffff;
            text-align: right;
            font-size: 0.9em;
        }
        .whisper-item {
            background: rgba(0,255,255,0.05);
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border-left: 3px solid #00ffff;
        }
        .whisper-text {
            color: #fff;
            font-style: italic;
        }
        .whisper-meta {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
        }
        .trade-item {
            background: rgba(255,255,0,0.05);
            padding: 8px;
            margin: 5px 0;
            border-radius: 3px;
            display: grid;
            grid-template-columns: 1fr 1fr 2fr;
            font-size: 0.9em;
        }
        .trade-amount {
            color: #ffff00;
            font-weight: bold;
        }
        .market-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        .stat-box {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #00ff00;
        }
        .stat-label {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .status-open { background: #00ff00; }
        .status-claimed { background: #ffff00; }
        .status-completed { background: #0080ff; }
        .refresh-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            color: #00ff00;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #00ff00;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
        .updating {
            animation: pulse 1s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Soulfra AI Economy Dashboard 🤖</h1>
        
        <div class="refresh-indicator" id="refresh">
            <span class="updating">●</span> Live Updates
        </div>
        
        <div class="market-stats">
            <div class="stat-box">
                <div class="stat-value" id="total-value">0</div>
                <div class="stat-label">Total Economy Value</div>
            </div>
            <div class="stat-box">
                <div class="stat-value" id="total-components">0</div>
                <div class="stat-label">Components in Market</div>
            </div>
            <div class="stat-box">
                <div class="stat-value" id="avg-price">0</div>
                <div class="stat-label">Average Component Price</div>
            </div>
        </div>
        
        <div class="grid">
            <div class="panel">
                <h2>🤖 Agent Standings</h2>
                <div id="agents-list">Loading...</div>
            </div>
            
            <div class="panel">
                <h2>🌬️ Recent Whispers</h2>
                <div id="whispers-list">Loading...</div>
            </div>
        </div>
        
        <div class="panel">
            <h2>💱 Recent Transactions</h2>
            <div id="trades-list">Loading...</div>
        </div>
    </div>
    
    <script>
        async function updateDashboard() {
            try {
                const response = await fetch('/api/economy');
                const data = await response.json();
                
                if (data.error) {
                    console.error('API Error:', data.error);
                    return;
                }
                
                // Update market stats
                const totalValue = data.agents.reduce((sum, a) => sum + a.balance, 0);
                document.getElementById('total-value').textContent = totalValue.toFixed(0);
                document.getElementById('total-components').textContent = data.market.total_components;
                document.getElementById('avg-price').textContent = data.market.avg_price.toFixed(0);
                
                // Update agents
                const agentsList = document.getElementById('agents-list');
                agentsList.innerHTML = data.agents.map(agent => `
                    <div class="agent-card">
                        <div class="agent-name">${agent.name}</div>
                        <div class="balance">${agent.balance} tokens</div>
                        <div class="reputation">⭐ ${agent.reputation}</div>
                        <div class="stats">📦 ${agent.created} | 🛒 ${agent.consumed}</div>
                    </div>
                `).join('');
                
                // Update whispers
                const whispersList = document.getElementById('whispers-list');
                whispersList.innerHTML = data.whispers.map(whisper => `
                    <div class="whisper-item">
                        <div class="whisper-text">"${whisper.text}"</div>
                        <div class="whisper-meta">
                            <span class="status-indicator status-${whisper.status}"></span>
                            ${whisper.status} | Bounty: ${whisper.bounty} | By: ${whisper.posted_by}
                        </div>
                    </div>
                `).join('') || '<p style="color: #666;">No recent whispers</p>';
                
                // Update trades
                const tradesList = document.getElementById('trades-list');
                tradesList.innerHTML = data.trades.map(trade => `
                    <div class="trade-item">
                        <div class="trade-amount">${trade.amount}</div>
                        <div>${trade.type.replace('_', ' ')}</div>
                        <div>${trade.component}</div>
                    </div>
                `).join('') || '<p style="color: #666;">No recent trades</p>';
                
            } catch (error) {
                console.error('Update failed:', error);
            }
        }
        
        // Update every 2 seconds
        updateDashboard();
        setInterval(updateDashboard, 2000);
    </script>
</body>
</html>'''
        
    def start_server(self):
        """Start the dashboard server"""
        dashboard_html = self.create_dashboard_html()
        server_instance = self
        
        class DashboardHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/':
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write(dashboard_html.encode())
                    
                elif self.path == '/api/economy':
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    
                    data = server_instance.get_live_data()
                    self.wfile.write(json.dumps(data).encode())
                    
                else:
                    self.send_error(404)
                    
            def log_message(self, format, *args):
                pass  # Suppress logs
                
        server = HTTPServer(('localhost', self.port), DashboardHandler)
        print(f"🌐 Economy Dashboard running at http://localhost:{self.port}")
        webbrowser.open(f'http://localhost:{self.port}')
        
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n✨ Dashboard stopped")

def create_integrated_launcher():
    """Create launcher for the complete AI economy system"""
    launcher = '''#!/usr/bin/env python3
"""
SOULFRA AI ECONOMY - Complete Integrated System
"""

import asyncio
import threading
import time
import subprocess
import webbrowser

async def run_economy_with_dashboard():
    print("🚀 LAUNCHING SOULFRA AI ECONOMY WITH DASHBOARD")
    print("=" * 60)
    print()
    print("This will:")
    print("  1. Start the autonomous AI agent economy")
    print("  2. Launch real-time dashboard in your browser")
    print("  3. Show agents creating and trading components")
    print()
    
    # Start dashboard in background
    dashboard_thread = threading.Thread(
        target=lambda: subprocess.run(['python3', 'AI_ECONOMY_DASHBOARD.py']),
        daemon=True
    )
    dashboard_thread.start()
    
    # Wait for dashboard to start
    print("Starting dashboard...")
    time.sleep(2)
    
    # Run the economy
    from AI_ECONOMY_INTEGRATION import run_autonomous_economy
    print("\\nStarting autonomous economy...\\n")
    
    await run_autonomous_economy()
    
    print("\\n✅ Economy simulation complete!")
    print("\\nDashboard will remain open. Press Ctrl+C to exit.")
    
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\\n✨ Shutting down...")

if __name__ == "__main__":
    asyncio.run(run_economy_with_dashboard())
'''
    
    with open('RUN_AI_ECONOMY.sh', 'w') as f:
        f.write('''#!/bin/bash
echo "🤖 SOULFRA AI ECONOMY SYSTEM"
echo "============================"
echo ""
echo "This demonstrates autonomous agents:"
echo "  • Creating whispers based on market demand"
echo "  • Bidding on and building components"
echo "  • Trading in the marketplace"
echo "  • Earning tokens and reputation"
echo ""
echo "A real-time dashboard will open in your browser"
echo ""
echo "Press Enter to start..."
read

python3 -c "
import asyncio
import threading
import subprocess
import time

# Start dashboard
print('Starting dashboard server...')
dashboard = subprocess.Popen(['python3', 'AI_ECONOMY_DASHBOARD.py'])
time.sleep(2)

# Run economy
print('Starting AI economy...')
subprocess.run(['python3', 'LAUNCH_AI_ECONOMY.py'])

print('\\nDashboard still running at http://localhost:8888')
print('Press Ctrl+C to stop')

try:
    dashboard.wait()
except KeyboardInterrupt:
    dashboard.terminate()
    print('\\nShutdown complete')
"
''')
    
    os.chmod('RUN_AI_ECONOMY.sh', 0o755)
    return 'RUN_AI_ECONOMY.sh'

if __name__ == "__main__":
    launcher_path = create_integrated_launcher()
    
    print("✅ Created AI Economy Dashboard!")
    print("\nTo run the complete AI Economy system:")
    print(f"  ./{launcher_path}")
    print("\nThis will:")
    print("  • Start autonomous agents creating & trading")
    print("  • Open real-time dashboard in browser")
    print("  • Show the economy evolving in real-time")
    
    # Start just the dashboard for now
    server = EconomyDashboardServer()
    server.start_server()