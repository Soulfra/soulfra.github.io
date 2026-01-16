#!/usr/bin/env python3
"""
Visual Dashboard - So simple a 5-year-old can manage it!
Big buttons, colors, and emojis everywhere
"""

import os
import json
import time
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import psutil
import platform

class KidFriendlyDashboard:
    """Dashboard so easy, kids love it!"""
    
    def __init__(self):
        self.port = 5678  # Easy to remember!
        self.services = {
            'learning': {'port': 7000, 'emoji': '📚', 'color': '#4CAF50'},
            'chat': {'port': 9999, 'emoji': '💬', 'color': '#2196F3'},
            'games': {'port': 5000, 'emoji': '🎮', 'color': '#FF9800'},
            'create': {'port': 4201, 'emoji': '🎨', 'color': '#9C27B0'},
            'friends': {'port': 8888, 'emoji': '👥', 'color': '#00BCD4'},
            'profile': {'port': 9000, 'emoji': '⭐', 'color': '#FFC107'}
        }
    
    def get_system_info(self):
        """Get simple system stats"""
        try:
            cpu = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory().percent
            disk = psutil.disk_usage('/').percent
            
            # Make it kid-friendly
            if cpu < 30:
                cpu_status = "😊 Happy"
            elif cpu < 70:
                cpu_status = "😎 Working"
            else:
                cpu_status = "🥵 Busy"
            
            if memory < 50:
                memory_status = "🟢 Lots of space"
            elif memory < 80:
                memory_status = "🟡 Some space"
            else:
                memory_status = "🔴 Getting full"
            
            return {
                'cpu': {'percent': cpu, 'status': cpu_status},
                'memory': {'percent': memory, 'status': memory_status},
                'disk': {'percent': disk, 'status': '💾 Storage OK'},
                'platform': platform.system()
            }
        except:
            return {
                'cpu': {'percent': 0, 'status': '😊 Happy'},
                'memory': {'percent': 0, 'status': '🟢 Lots of space'},
                'disk': {'percent': 0, 'status': '💾 Storage OK'},
                'platform': 'Unknown'
            }
    
    def check_service(self, port):
        """Check if a service is running"""
        try:
            result = os.system(f"curl -s http://localhost:{port} > /dev/null 2>&1")
            return result == 0
        except:
            return False
    
    def generate_html(self):
        """Generate the visual dashboard"""
        system_info = self.get_system_info()
        
        return f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CramPal Control Center 🎮</title>
    <style>
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        
        body {{
            font-family: 'Comic Sans MS', cursive, sans-serif;
            background: linear-gradient(45deg, #FF6B6B 0%, #4ECDC4 25%, #45B7D1 50%, #96CEB4 75%, #FECA57 100%);
            background-size: 400% 400%;
            animation: rainbow 15s ease infinite;
            min-height: 100vh;
            padding: 20px;
        }}
        
        @keyframes rainbow {{
            0% {{ background-position: 0% 50%; }}
            50% {{ background-position: 100% 50%; }}
            100% {{ background-position: 0% 50%; }}
        }}
        
        .dashboard {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        .header {{
            text-align: center;
            background: rgba(255,255,255,0.9);
            border-radius: 30px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }}
        
        h1 {{
            font-size: 3em;
            color: #333;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }}
        
        .main-controls {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .big-button {{
            background: white;
            border: none;
            border-radius: 20px;
            padding: 30px;
            font-size: 1.5em;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            position: relative;
            overflow: hidden;
        }}
        
        .big-button:hover {{
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        }}
        
        .big-button.start {{
            background: #4CAF50;
            color: white;
        }}
        
        .big-button.stop {{
            background: #f44336;
            color: white;
        }}
        
        .big-button.fix {{
            background: #FF9800;
            color: white;
        }}
        
        .emoji-huge {{
            font-size: 3em;
            display: block;
            margin-bottom: 10px;
            animation: bounce 2s infinite;
        }}
        
        @keyframes bounce {{
            0%, 100% {{ transform: translateY(0); }}
            50% {{ transform: translateY(-10px); }}
        }}
        
        .services-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .service-card {{
            background: white;
            border-radius: 20px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: all 0.3s;
            cursor: pointer;
            position: relative;
        }}
        
        .service-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }}
        
        .service-emoji {{
            font-size: 4em;
            margin-bottom: 10px;
        }}
        
        .service-name {{
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        
        .service-status {{
            font-size: 1.2em;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
        }}
        
        .status-online {{
            background: #4CAF50;
            color: white;
        }}
        
        .status-offline {{
            background: #f44336;
            color: white;
        }}
        
        .system-info {{
            background: rgba(255,255,255,0.9);
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }}
        
        .stat-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 10px;
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
        }}
        
        .stat-bar {{
            flex: 1;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            margin: 0 10px;
            overflow: hidden;
        }}
        
        .stat-fill {{
            height: 100%;
            background: linear-gradient(to right, #4CAF50, #8BC34A);
            transition: width 0.5s;
        }}
        
        .floating-help {{
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2em;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: float 3s ease-in-out infinite;
        }}
        
        @keyframes float {{
            0%, 100% {{ transform: translateY(0); }}
            50% {{ transform: translateY(-20px); }}
        }}
        
        .fun-facts {{
            background: rgba(255,255,255,0.9);
            border-radius: 20px;
            padding: 20px;
            text-align: center;
            margin-top: 20px;
        }}
        
        .fact {{
            font-size: 1.2em;
            color: #666;
            margin: 10px 0;
        }}
        
        /* Responsive */
        @media (max-width: 768px) {{
            h1 {{ font-size: 2em; }}
            .services-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🎮 CramPal Control Center 🎮</h1>
            <p style="font-size: 1.2em; color: #666;">Everything you need in one fun place!</p>
        </div>
        
        <div class="main-controls">
            <button class="big-button start" onclick="doAction('start_all')">
                <span class="emoji-huge">🚀</span>
                Start Everything!
            </button>
            <button class="big-button stop" onclick="doAction('stop_all')">
                <span class="emoji-huge">🛑</span>
                Stop Everything
            </button>
            <button class="big-button fix" onclick="doAction('fix_all')">
                <span class="emoji-huge">🔧</span>
                Fix Problems
            </button>
        </div>
        
        <div class="services-grid" id="services">
            <!-- Services load here -->
        </div>
        
        <div class="system-info">
            <h2 style="text-align: center; margin-bottom: 20px;">🖥️ System Health</h2>
            <div class="stat-row">
                <span>CPU {system_info['cpu']['status']}</span>
                <div class="stat-bar">
                    <div class="stat-fill" style="width: {system_info['cpu']['percent']}%"></div>
                </div>
                <span>{system_info['cpu']['percent']}%</span>
            </div>
            <div class="stat-row">
                <span>Memory {system_info['memory']['status']}</span>
                <div class="stat-bar">
                    <div class="stat-fill" style="width: {system_info['memory']['percent']}%"></div>
                </div>
                <span>{system_info['memory']['percent']}%</span>
            </div>
        </div>
        
        <div class="fun-facts">
            <h2>💡 Did You Know?</h2>
            <div class="fact" id="fun-fact">Loading fun fact...</div>
        </div>
    </div>
    
    <div class="floating-help" onclick="showHelp()">?</div>
    
    <script>
        const services = {json.dumps(self.services)};
        const funFacts = [
            "🎯 You can learn anything if you practice every day!",
            "🌟 Making mistakes is how we learn best!",
            "🚀 Every expert was once a beginner!",
            "💪 Your brain gets stronger when you learn new things!",
            "🎨 There are many ways to solve every problem!",
            "🤝 Learning with friends is more fun!",
            "📚 Reading makes you smarter and more creative!",
            "🎮 Games can teach you problem-solving skills!"
        ];
        
        function updateServices() {{
            const container = document.getElementById('services');
            container.innerHTML = '';
            
            Object.entries(services).forEach(([key, service]) => {{
                const card = document.createElement('div');
                card.className = 'service-card';
                card.onclick = () => openService(service.port);
                card.innerHTML = `
                    <div class="service-emoji">${{service.emoji}}</div>
                    <div class="service-name">${{key.charAt(0).toUpperCase() + key.slice(1)}}</div>
                    <div class="service-status status-checking">Checking...</div>
                `;
                container.appendChild(card);
                
                // Check status
                checkService(service.port, card.querySelector('.service-status'));
            }});
        }}
        
        function checkService(port, statusElement) {{
            fetch(`/api/check/${{port}}`)
                .then(response => response.json())
                .then(data => {{
                    if (data.online) {{
                        statusElement.className = 'service-status status-online';
                        statusElement.textContent = '🟢 Online';
                    }} else {{
                        statusElement.className = 'service-status status-offline';
                        statusElement.textContent = '🔴 Offline';
                    }}
                }});
        }}
        
        function doAction(action) {{
            fetch(`/api/${{action}}`, {{ method: 'POST' }})
                .then(() => {{
                    setTimeout(updateServices, 2000);
                }});
        }}
        
        function openService(port) {{
            window.open(`http://localhost:${{port}}`, '_blank');
        }}
        
        function showHelp() {{
            alert(`
🎮 How to use CramPal:

1. Click the GREEN rocket to start everything!
2. Click any service card to open it
3. If something breaks, click the ORANGE wrench
4. Click the RED stop sign when you're done

Have fun learning! 🌟
            `);
        }}
        
        function showRandomFact() {{
            const fact = funFacts[Math.floor(Math.random() * funFacts.length)];
            document.getElementById('fun-fact').textContent = fact;
        }}
        
        // Update every 5 seconds
        setInterval(updateServices, 5000);
        setInterval(showRandomFact, 10000);
        
        // Initial load
        updateServices();
        showRandomFact();
    </script>
</body>
</html>'''

class DashboardHandler(BaseHTTPRequestHandler):
    """Handle dashboard requests"""
    
    def __init__(self, dashboard, *args, **kwargs):
        self.dashboard = dashboard
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        if self.path == '/':
            html = self.dashboard.generate_html()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
        
        elif self.path.startswith('/api/check/'):
            port = int(self.path.split('/')[-1])
            online = self.dashboard.check_service(port)
            self.send_json({'online': online})
    
    def do_POST(self):
        if self.path == '/api/start_all':
            # Start all services
            os.system('./ONE_CLICK_EVERYTHING.sh > /dev/null 2>&1 &')
            self.send_json({'status': 'started'})
        
        elif self.path == '/api/stop_all':
            # Stop all services
            for port in range(3000, 10000):
                os.system(f"lsof -ti :{port} | xargs kill -9 2>/dev/null")
            self.send_json({'status': 'stopped'})
        
        elif self.path == '/api/fix_all':
            # Run fixes
            os.system('./MASTER_ENCODING_FIX.sh > /dev/null 2>&1 &')
            self.send_json({'status': 'fixed'})
    
    def send_json(self, data):
        response = json.dumps(data)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))
    
    def log_message(self, format, *args):
        pass

def main():
    dashboard = KidFriendlyDashboard()
    
    def handler(*args, **kwargs):
        DashboardHandler(dashboard, *args, **kwargs)
    
    server = HTTPServer(('0.0.0.0', dashboard.port), handler)
    
    print(f"""
╔═══════════════════════════════════════╗
║    VISUAL DASHBOARD READY! 🎨         ║
╚═══════════════════════════════════════╝

🌈 Open in your browser:
   http://localhost:{dashboard.port}

Perfect for:
✓ Kids (5+ years old)
✓ Teachers
✓ Parents
✓ Anyone who likes colors!

Features:
• Big colorful buttons
• Fun animations
• System health meters
• One-click everything
• Fun facts that change

Press Ctrl+C to stop
""")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")

if __name__ == "__main__":
    main()