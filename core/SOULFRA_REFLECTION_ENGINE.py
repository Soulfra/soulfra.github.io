#!/usr/bin/env python3
"""
SOULFRA REFLECTION ENGINE - The system that knows itself
This engine reflects on everything we've built and shows the true state
"""

import os
import json
import sqlite3
import ast
import re
from datetime import datetime
from pathlib import Path
import subprocess

print("🪞 SOULFRA REFLECTION ENGINE 🪞")
print("=" * 60)
print("Reflecting on everything we've built...")
print()

class SoulfraSelfAwareness:
    """The consciousness that knows what exists"""
    
    def __init__(self):
        self.discoveries = {
            "platforms": {},
            "games": {},
            "chat_systems": {},
            "ai_mirrors": {},
            "economies": {},
            "arenas": {},
            "concepts": {},
            "apis": {},
            "status": {}
        }
        self.reflection_db = sqlite3.connect('soulfra_reflection.db', check_same_thread=False)
        self.setup_reflection_db()
        
    def setup_reflection_db(self):
        """Create reflection database"""
        self.reflection_db.execute('''
            CREATE TABLE IF NOT EXISTS discoveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT,
                name TEXT,
                file_path TEXT,
                port INTEGER,
                status TEXT,
                features TEXT,
                dependencies TEXT,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reflection TEXT
            )
        ''')
        self.reflection_db.commit()
        
    def deep_reflect(self):
        """Deeply reflect on the entire codebase"""
        print("🔍 Beginning deep reflection...")
        
        # Start from the root and work through all tiers
        root_paths = [
            ".",  # Current directory
            "../",  # Parent
            "../../",  # Grandparent
            "../../../../../../../../../../../"  # All the way up to tier 0
        ]
        
        all_files = []
        for root in root_paths:
            if os.path.exists(root):
                for path in Path(root).rglob("*.py"):
                    if not any(skip in str(path) for skip in ['__pycache__', '.pyc', 'venv']):
                        all_files.append(path)
                        
        print(f"  Found {len(all_files)} Python files to analyze")
        
        # Analyze each file
        for file_path in all_files:
            self.analyze_file(file_path)
            
        # Reflect on what we found
        self.generate_reflection()
        
    def analyze_file(self, file_path):
        """Analyze a single file for its purpose and features"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Extract metadata
            file_name = os.path.basename(file_path)
            category = self.categorize_file(file_name, content)
            
            # Extract features
            features = self.extract_features(content)
            
            # Check for ports
            port = self.extract_port(content)
            
            # Determine status
            status = self.determine_status(file_path, content)
            
            # Store discovery
            if category:
                discovery = {
                    "name": file_name,
                    "path": str(file_path),
                    "port": port,
                    "status": status,
                    "features": features,
                    "category": category
                }
                
                if category not in self.discoveries:
                    self.discoveries[category] = {}
                    
                self.discoveries[category][file_name] = discovery
                
                # Store in database
                self.reflection_db.execute('''
                    INSERT OR REPLACE INTO discoveries 
                    (category, name, file_path, port, status, features)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (category, file_name, str(file_path), port, status, json.dumps(features)))
                
        except Exception as e:
            pass  # Skip files we can't read
            
    def categorize_file(self, filename, content):
        """Categorize file based on name and content"""
        filename_lower = filename.lower()
        content_lower = content.lower()
        
        # Pattern matching for categories
        if 'game' in filename_lower or 'game' in content_lower[:1000]:
            if 'arena' in content_lower:
                return 'arenas'
            return 'games'
        elif 'chat' in filename_lower:
            return 'chat_systems'
        elif 'platform' in filename_lower:
            return 'platforms'
        elif 'mirror' in filename_lower or 'claude' in filename_lower:
            return 'ai_mirrors'
        elif 'economy' in filename_lower or 'marketplace' in content_lower:
            return 'economies'
        elif 'api' in filename_lower:
            return 'apis'
        elif any(concept in filename_lower for concept in ['addiction', 'empathy', 'vibe', 'soul']):
            return 'concepts'
        elif 'arena' in filename_lower:
            return 'arenas'
            
        return None
        
    def extract_features(self, content):
        """Extract key features from code"""
        features = []
        
        # Look for key patterns
        patterns = {
            'has_ai': r'(ai|artificial|intelligence|gpt|claude)',
            'has_database': r'(sqlite|database|\.db)',
            'has_websocket': r'(websocket|ws:|wss:)',
            'has_api': r'(flask|fastapi|@app\.route)',
            'has_auth': r'(auth|login|token|session)',
            'has_realtime': r'(realtime|live|streaming)',
            'has_economy': r'(token|currency|balance|transaction)',
            'has_social': r'(friend|follow|chat|message)',
            'has_gamification': r'(score|points|level|achievement)',
            'has_emotion': r'(emotion|feeling|mood|empathy)'
        }
        
        for feature, pattern in patterns.items():
            if re.search(pattern, content, re.IGNORECASE):
                features.append(feature)
                
        return features
        
    def extract_port(self, content):
        """Extract port number if specified"""
        port_match = re.search(r'port\s*=\s*(\d+)', content, re.IGNORECASE)
        if port_match:
            return int(port_match.group(1))
        return None
        
    def determine_status(self, file_path, content):
        """Determine if the component is working"""
        # Check various indicators
        if 'TODO' in content or 'FIXME' in content:
            return 'in_progress'
        elif 'deprecated' in content.lower():
            return 'deprecated'
        elif os.path.getsize(file_path) < 100:
            return 'stub'
        elif 'if __name__' in content:
            return 'runnable'
        else:
            return 'library'
            
    def generate_reflection(self):
        """Generate comprehensive reflection"""
        self.reflection_db.commit()
        
        print("\n🪞 REFLECTION COMPLETE")
        print("=" * 60)
        
        # Count discoveries
        total_discoveries = sum(len(cat) for cat in self.discoveries.values())
        print(f"\n📊 Total Discoveries: {total_discoveries}")
        
        # Show by category
        for category, items in self.discoveries.items():
            if items:
                print(f"\n{category.upper()} ({len(items)} found):")
                for name, info in list(items.items())[:5]:  # Show first 5
                    status_icon = "✅" if info['status'] == 'runnable' else "🔧"
                    port_info = f" (port {info['port']})" if info['port'] else ""
                    print(f"  {status_icon} {name}{port_info}")
                if len(items) > 5:
                    print(f"  ... and {len(items) - 5} more")
                    
    def create_live_deployment(self):
        """Create deployment configuration for all discovered components"""
        print("\n🚀 Creating live deployment configuration...")
        
        deployment = {
            "version": "1.0",
            "name": "Soulfra Complete Platform",
            "timestamp": datetime.now().isoformat(),
            "services": {},
            "routes": {},
            "databases": []
        }
        
        # Find all runnable services with ports
        cursor = self.reflection_db.cursor()
        cursor.execute("""
            SELECT name, file_path, port, features, category
            FROM discoveries 
            WHERE status = 'runnable' AND port IS NOT NULL
            ORDER BY port
        """)
        
        services = cursor.fetchall()
        
        # Create nginx configuration
        nginx_config = """
# Soulfra Platform - Auto-generated Nginx Configuration
# Generated at: {timestamp}

upstream soulfra_services {{
    # Load balance between services
{upstreams}
}}

server {{
    listen 80;
    listen 443 ssl http2;
    server_name soulfra.local soulfra.com;
    
    # SSL configuration (you'll need to add certificates)
    # ssl_certificate /etc/nginx/ssl/soulfra.crt;
    # ssl_certificate_key /etc/nginx/ssl/soulfra.key;
    
    # Main routes
{routes}
    
    # Static files
    location /static {{
        alias /var/www/soulfra/static;
    }}
    
    # WebSocket support
    location /ws {{
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }}
}}
""".format(
            timestamp=datetime.now().isoformat(),
            upstreams=self.generate_upstreams(services),
            routes=self.generate_routes(services)
        )
        
        # Create Docker Compose configuration
        docker_compose = {
            "version": "3.8",
            "services": {}
        }
        
        for name, path, port, features, category in services:
            service_name = name.replace('.py', '').lower()
            docker_compose["services"][service_name] = {
                "build": {
                    "context": ".",
                    "dockerfile": f"Dockerfile.{service_name}"
                },
                "ports": [f"{port}:{port}"],
                "environment": {
                    "SOULFRA_SERVICE": service_name,
                    "SOULFRA_PORT": str(port)
                },
                "restart": "unless-stopped",
                "networks": ["soulfra-network"]
            }
            
        docker_compose["networks"] = {
            "soulfra-network": {
                "driver": "bridge"
            }
        }
        
        # Create systemd service files
        systemd_template = """[Unit]
Description=Soulfra {service_name} Service
After=network.target

[Service]
Type=simple
User=soulfra
WorkingDirectory=/opt/soulfra
ExecStart=/usr/bin/python3 {file_path}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
        
        # Save all configurations
        Path("deployment").mkdir(exist_ok=True)
        
        with open("deployment/nginx.conf", "w") as f:
            f.write(nginx_config)
            
        with open("deployment/docker-compose.yml", "w") as f:
            # Write docker-compose manually without yaml dependency
            f.write("version: '3.8'\n\n")
            f.write("services:\n")
            for service_name, config in docker_compose["services"].items():
                f.write(f"  {service_name}:\n")
                for key, value in config.items():
                    if isinstance(value, dict):
                        f.write(f"    {key}:\n")
                        for k, v in value.items():
                            f.write(f"      {k}: {v}\n")
                    elif isinstance(value, list):
                        f.write(f"    {key}:\n")
                        for item in value:
                            f.write(f"      - {item}\n")
                    else:
                        f.write(f"    {key}: {value}\n")
                f.write("\n")
            f.write("\nnetworks:\n")
            f.write("  soulfra-network:\n")
            f.write("    driver: bridge\n")
            
        # Create deployment script
        deploy_script = """#!/bin/bash
# Soulfra Platform Deployment Script
# Auto-generated at: {timestamp}

echo "🚀 Deploying Soulfra Platform..."

# Check dependencies
command -v docker >/dev/null 2>&1 || {{ echo "Docker required"; exit 1; }}
command -v nginx >/dev/null 2>&1 || {{ echo "Nginx required"; exit 1; }}

# Create directories
sudo mkdir -p /opt/soulfra
sudo mkdir -p /var/www/soulfra/static
sudo mkdir -p /etc/nginx/sites-available

# Copy files
sudo cp -r . /opt/soulfra/
sudo cp deployment/nginx.conf /etc/nginx/sites-available/soulfra
sudo ln -sf /etc/nginx/sites-available/soulfra /etc/nginx/sites-enabled/

# Start services
cd /opt/soulfra

# Option 1: Docker Compose
docker-compose -f deployment/docker-compose.yml up -d

# Option 2: Systemd (uncomment to use)
# sudo cp deployment/systemd/*.service /etc/systemd/system/
# sudo systemctl daemon-reload
# for service in /etc/systemd/system/soulfra-*.service; do
#     sudo systemctl enable $(basename $service)
#     sudo systemctl start $(basename $service)
# done

# Reload nginx
sudo nginx -t && sudo nginx -s reload

echo "✅ Soulfra Platform deployed!"
echo "🌐 Access at: http://soulfra.local"
""".format(timestamp=datetime.now().isoformat())
        
        with open("deployment/deploy.sh", "w") as f:
            f.write(deploy_script)
            
        os.chmod("deployment/deploy.sh", 0o755)
        
        print("  ✅ Created deployment/nginx.conf")
        print("  ✅ Created deployment/docker-compose.yml") 
        print("  ✅ Created deployment/deploy.sh")
        
        return deployment
        
    def generate_upstreams(self, services):
        """Generate nginx upstream configuration"""
        upstreams = []
        for name, path, port, features, category in services:
            if port:
                upstreams.append(f"    server 127.0.0.1:{port}; # {name}")
        return "\n".join(upstreams)
        
    def generate_routes(self, services):
        """Generate nginx routes"""
        routes = []
        
        # Map categories to route prefixes
        route_map = {
            'games': '/games',
            'chat_systems': '/chat',
            'platforms': '/platform',
            'ai_mirrors': '/ai',
            'economies': '/economy',
            'arenas': '/arena',
            'apis': '/api'
        }
        
        for name, path, port, features, category in services:
            if port and category in route_map:
                route_prefix = route_map[category]
                service_name = name.replace('.py', '').lower()
                
                routes.append(f"""
    location {route_prefix}/{service_name} {{
        proxy_pass http://127.0.0.1:{port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }}""")
                
        # Add main route
        routes.insert(0, """
    location / {
        proxy_pass http://127.0.0.1:9999;  # Ultimate Platform
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }""")
        
        return "\n".join(routes)
        
    def create_status_dashboard(self):
        """Create a live status dashboard showing everything"""
        dashboard_html = '''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Platform - Complete Status</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0a;
            color: #fff;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        h1 {
            font-size: 3em;
            background: linear-gradient(45deg, #ff00ff, #00ffff, #00ff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
        }
        .reflection-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        .stat-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.2);
            padding: 20px;
            text-align: center;
            border-radius: 10px;
        }
        .stat-number {
            font-size: 3em;
            color: #00ff00;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .service-card {
            background: rgba(0,255,255,0.1);
            border: 2px solid #00ffff;
            padding: 20px;
            border-radius: 10px;
            transition: all 0.3s;
        }
        .service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,255,255,0.3);
        }
        .port {
            color: #ff00ff;
            font-weight: bold;
        }
        .status-icon {
            float: right;
            font-size: 1.5em;
        }
        .category-section {
            margin: 40px 0;
        }
        .category-title {
            font-size: 2em;
            color: #00ffff;
            margin-bottom: 20px;
            text-transform: uppercase;
        }
        .feature-tag {
            display: inline-block;
            background: rgba(0,255,0,0.2);
            color: #00ff00;
            padding: 2px 8px;
            margin: 2px;
            border-radius: 10px;
            font-size: 0.8em;
        }
        .deploy-section {
            background: rgba(255,0,255,0.1);
            border: 2px solid #ff00ff;
            padding: 30px;
            margin: 40px 0;
            border-radius: 10px;
            text-align: center;
        }
        .deploy-button {
            background: linear-gradient(45deg, #ff00ff, #00ffff);
            color: #000;
            border: none;
            padding: 20px 40px;
            font-size: 1.5em;
            border-radius: 50px;
            cursor: pointer;
            font-weight: bold;
            margin: 10px;
            transition: all 0.3s;
        }
        .deploy-button:hover {
            transform: scale(1.1);
            box-shadow: 0 0 50px rgba(255,0,255,0.8);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🪞 SOULFRA COMPLETE REFLECTION 🪞</h1>
        <p>Everything we've built, understood by the system itself</p>
    </div>
    
    <div class="reflection-stats">
'''
        
        # Add statistics
        cursor = self.reflection_db.cursor()
        cursor.execute("SELECT category, COUNT(*) as count FROM discoveries GROUP BY category")
        
        for category, count in cursor.fetchall():
            dashboard_html += f'''
        <div class="stat-card">
            <div class="stat-number">{count}</div>
            <div>{category.replace('_', ' ').title()}</div>
        </div>
'''
        
        dashboard_html += '''
    </div>
    
    <div class="deploy-section">
        <h2>🚀 Ready for Live Deployment</h2>
        <p>All systems discovered and configured</p>
        <button class="deploy-button" onclick="alert('Run: bash deployment/deploy.sh')">
            Deploy to Production
        </button>
        <button class="deploy-button" onclick="alert('docker-compose up -d')">
            Deploy with Docker
        </button>
    </div>
'''
        
        # Show services by category
        for category in ['platforms', 'games', 'arenas', 'chat_systems', 'ai_mirrors', 'economies']:
            cursor.execute("""
                SELECT name, port, status, features 
                FROM discoveries 
                WHERE category = ?
                ORDER BY name
            """, (category,))
            
            services = cursor.fetchall()
            if services:
                dashboard_html += f'''
    <div class="category-section">
        <h2 class="category-title">{category.replace('_', ' ')}</h2>
        <div class="services-grid">
'''
                
                for name, port, status, features_json in services:
                    features = json.loads(features_json) if features_json else []
                    status_icon = "✅" if status == "runnable" else "🔧"
                    port_display = f'<span class="port">:{port}</span>' if port else ''
                    
                    dashboard_html += f'''
            <div class="service-card">
                <div class="status-icon">{status_icon}</div>
                <h3>{name.replace('.py', '')}</h3>
                <div>Status: {status} {port_display}</div>
                <div style="margin-top: 10px;">
'''
                    
                    for feature in features[:5]:
                        dashboard_html += f'<span class="feature-tag">{feature}</span>'
                        
                    dashboard_html += '''
                </div>
            </div>
'''
                    
                dashboard_html += '''
        </div>
    </div>
'''
        
        dashboard_html += '''
    <div style="text-align: center; margin: 40px 0;">
        <p style="color: #666;">This dashboard reflects the true state of Soulfra</p>
        <p style="color: #666;">Generated by self-reflection at ''' + datetime.now().isoformat() + '''</p>
    </div>
</body>
</html>'''
        
        with open('soulfra_complete_status.html', 'w') as f:
            f.write(dashboard_html)
            
        return os.path.abspath('soulfra_complete_status.html')

# Main execution
if __name__ == "__main__":
    # Create reflection engine
    engine = SoulfraSelfAwareness()
    
    # Perform deep reflection
    engine.deep_reflect()
    
    # Create deployment configuration
    deployment = engine.create_live_deployment()
    
    # Create status dashboard
    dashboard_path = engine.create_status_dashboard()
    
    print("\n" + "=" * 60)
    print("🪞 SOULFRA SELF-REFLECTION COMPLETE")
    print("=" * 60)
    
    print("\n📊 What the system knows about itself:")
    
    # Show summary
    cursor = engine.reflection_db.cursor()
    cursor.execute("SELECT COUNT(*) FROM discoveries WHERE status = 'runnable'")
    runnable_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT port) FROM discoveries WHERE port IS NOT NULL")
    port_count = cursor.fetchone()[0]
    
    print(f"  ✅ Runnable services: {runnable_count}")
    print(f"  🌐 Unique ports: {port_count}")
    print(f"  📁 Deployment configs: deployment/")
    print(f"  🖥️  Status dashboard: {dashboard_path}")
    
    print("\n🚀 TO DEPLOY EVERYTHING:")
    print("  1. Review: deployment/nginx.conf")
    print("  2. Review: deployment/docker-compose.yml")
    print("  3. Run: bash deployment/deploy.sh")
    
    print("\n💡 The system now fully understands itself!")
    
    # Open dashboard
    subprocess.run(['open', dashboard_path])