#!/usr/bin/env python3
"""
SOULFRA LIVE DEPLOYMENT - Deploy everything we've built as a live site
"""

import os
import json
from datetime import datetime
from pathlib import Path

print("🚀 SOULFRA LIVE DEPLOYMENT SYSTEM 🚀")
print("=" * 60)
print("Preparing to deploy everything as a live site...")
print()

# All the systems we've discovered from the codebase search
SOULFRA_SYSTEMS = {
    "core_platforms": [
        {
            "name": "Ultimate Platform",
            "file": "ULTIMATE_PLATFORM.py",
            "port": 9999,
            "description": "Main integrated platform with games, AI, economy",
            "features": ["games", "ai_mirrors", "economy", "social"]
        },
        {
            "name": "Enterprise Platform", 
            "file": "ENTERPRISE_PLATFORM.py",
            "port": 8080,
            "description": "Business features and department automation"
        },
        {
            "name": "Vibe Platform",
            "file": "VIBE_PLATFORM_MAX.py",
            "port": 5555,
            "description": "Emotion detection and vibe analysis"
        }
    ],
    
    "gaming_systems": [
        {
            "name": "Addiction Engine",
            "file": "ADDICTION_ENGINE.py",
            "port": 8086,
            "description": "Gamified learning with dopamine loops"
        },
        {
            "name": "Multiplayer Game",
            "file": "MULTIPLAYER_WEBSOCKET_GAME.py",
            "port": 8765,
            "description": "Real-time multiplayer gaming"
        },
        {
            "name": "Character Creator",
            "file": "DRAG_DROP_CHARACTER_CREATOR.py",
            "port": 5000,
            "description": "Drag and drop character creation"
        },
        {
            "name": "Empathy Game",
            "file": "EMPATHY_GAME_ENGINE.py",
            "port": 8087,
            "description": "Games that teach empathy"
        }
    ],
    
    "arena_systems": [
        {
            "name": "Dev Debug Arena",
            "file": "DEV_DEBUG_ARENA.py",
            "port": 8001,
            "description": "Developers compete to solve bugs"
        },
        {
            "name": "Support Heroes Arena",
            "file": "SUPPORT_HEROES_ARENA.py", 
            "port": 8002,
            "description": "Customer service gamification"
        }
    ],
    
    "chat_systems": [
        {
            "name": "Chat Processor",
            "file": "CHAT_PROCESSOR.py",
            "port": 8090,
            "description": "Main chat processing system"
        },
        {
            "name": "Simple Chat",
            "file": "SIMPLE_CHAT_PROCESSOR.py",
            "port": 5555,
            "description": "Lightweight chat system"
        }
    ],
    
    "ai_systems": [
        {
            "name": "Claude Bridge",
            "file": "CLAUDE_BRIDGE.py",
            "port": None,
            "description": "Claude AI integration"
        },
        {
            "name": "Mirror Bridge",
            "file": "MIRROR_BRIDGE.py",
            "port": 8700,
            "description": "Mirror agent system"
        },
        {
            "name": "Cal Domingo",
            "file": "CAL_DOMINGO_LOCALHOST.py",
            "port": 8080,
            "description": "AI personality system"
        }
    ],
    
    "infrastructure": [
        {
            "name": "API Router",
            "file": "API_ROUTER.py",
            "port": 8080,
            "description": "Main API routing"
        },
        {
            "name": "Platform Logger",
            "file": "PLATFORM_LOGGER.py",
            "port": None,
            "description": "Centralized logging"
        },
        {
            "name": "Real Monitoring",
            "file": "REAL_MONITORING.py",
            "port": None,
            "description": "System monitoring"
        }
    ],
    
    "economy_systems": [
        {
            "name": "AI Economy",
            "file": "AI_ECONOMY_INTEGRATION.py",
            "port": None,
            "description": "Autonomous AI marketplace"
        },
        {
            "name": "Soulfra Backend",
            "file": "SOULFRA_BACKEND_API.py",
            "port": 8080,
            "description": "Core backend API"
        }
    ]
}

def create_deployment_structure():
    """Create complete deployment structure"""
    
    # Create directories
    dirs = [
        "deployment/nginx",
        "deployment/docker",
        "deployment/kubernetes",
        "deployment/scripts",
        "deployment/configs"
    ]
    
    for d in dirs:
        Path(d).mkdir(parents=True, exist_ok=True)
        
def generate_nginx_config():
    """Generate Nginx configuration for all services"""
    
    nginx_config = """# Soulfra Complete Platform - Nginx Configuration
# Auto-generated at: {timestamp}

# Upstream definitions for all services
{upstreams}

# Main server block
server {{
    listen 80;
    listen 443 ssl http2;
    server_name soulfra.com www.soulfra.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/soulfra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/soulfra.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Main platform (Ultimate Platform)
    location / {{
        proxy_pass http://ultimate_platform;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
    
    # Gaming routes
{game_routes}
    
    # Arena routes  
{arena_routes}
    
    # Chat routes
{chat_routes}
    
    # AI routes
{ai_routes}
    
    # API routes
{api_routes}
    
    # WebSocket support
    location /ws {{
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }}
    
    # Static files
    location /static {{
        alias /var/www/soulfra/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }}
}}

# Redirect HTTP to HTTPS
server {{
    listen 80;
    server_name soulfra.com www.soulfra.com;
    return 301 https://$server_name$request_uri;
}}
"""
    
    # Generate upstreams
    upstreams = []
    for category, systems in SOULFRA_SYSTEMS.items():
        for system in systems:
            if system.get("port"):
                name = system["name"].lower().replace(" ", "_")
                upstreams.append(f"upstream {name} {{\n    server 127.0.0.1:{system['port']};\n}}")
                
    # Generate routes
    game_routes = generate_routes("games", SOULFRA_SYSTEMS["gaming_systems"])
    arena_routes = generate_routes("arena", SOULFRA_SYSTEMS["arena_systems"])
    chat_routes = generate_routes("chat", SOULFRA_SYSTEMS["chat_systems"])
    ai_routes = generate_routes("ai", SOULFRA_SYSTEMS["ai_systems"])
    api_routes = generate_routes("api", SOULFRA_SYSTEMS["infrastructure"])
    
    config = nginx_config.format(
        timestamp=datetime.now().isoformat(),
        upstreams="\n\n".join(upstreams),
        game_routes=game_routes,
        arena_routes=arena_routes,
        chat_routes=chat_routes,
        ai_routes=ai_routes,
        api_routes=api_routes
    )
    
    with open("deployment/nginx/soulfra.conf", "w") as f:
        f.write(config)
        
    print("✅ Created deployment/nginx/soulfra.conf")
    
def generate_routes(prefix, systems):
    """Generate nginx routes for a category"""
    routes = []
    for system in systems:
        if system.get("port"):
            name = system["name"].lower().replace(" ", "_")
            route_name = system["name"].lower().replace(" ", "-")
            routes.append(f"""
    location /{prefix}/{route_name} {{
        proxy_pass http://{name};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }}""")
    return "\n".join(routes)

def generate_docker_compose():
    """Generate Docker Compose configuration"""
    
    compose = """version: '3.8'

services:
"""
    
    # Add services
    for category, systems in SOULFRA_SYSTEMS.items():
        for system in systems:
            service_name = system["name"].lower().replace(" ", "-")
            compose += f"""
  {service_name}:
    build:
      context: ../../../
      dockerfile: deployment/docker/Dockerfile.{service_name}
    ports:
      - "{system.get('port', 8000)}:{system.get('port', 8000)}"
    environment:
      - SOULFRA_SERVICE={system['name']}
      - SOULFRA_ENV=production
    networks:
      - soulfra-network
    restart: unless-stopped
    volumes:
      - ./data/{service_name}:/data
"""
    
    # Add supporting services
    compose += """
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/soulfra.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - static-data:/var/www/soulfra/static
    depends_on:
      - ultimate-platform
    networks:
      - soulfra-network
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    networks:
      - soulfra-network
    restart: unless-stopped

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=soulfra
      - POSTGRES_USER=soulfra
      - POSTGRES_PASSWORD=soulfra_secure_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - soulfra-network
    restart: unless-stopped

networks:
  soulfra-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  static-data:
"""
    
    with open("deployment/docker/docker-compose.yml", "w") as f:
        f.write(compose)
        
    print("✅ Created deployment/docker/docker-compose.yml")

def generate_kubernetes_manifests():
    """Generate Kubernetes deployment manifests"""
    
    # Namespace
    namespace = """apiVersion: v1
kind: Namespace
metadata:
  name: soulfra
---
"""
    
    with open("deployment/kubernetes/00-namespace.yaml", "w") as f:
        f.write(namespace)
        
    # Generate deployment for each service
    for category, systems in SOULFRA_SYSTEMS.items():
        for system in systems:
            if system.get("port"):
                generate_k8s_deployment(system)
                
    print("✅ Created Kubernetes manifests in deployment/kubernetes/")

def generate_k8s_deployment(system):
    """Generate Kubernetes deployment for a service"""
    
    service_name = system["name"].lower().replace(" ", "-")
    
    manifest = f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service_name}
  namespace: soulfra
spec:
  replicas: 2
  selector:
    matchLabels:
      app: {service_name}
  template:
    metadata:
      labels:
        app: {service_name}
    spec:
      containers:
      - name: {service_name}
        image: soulfra/{service_name}:latest
        ports:
        - containerPort: {system.get('port', 8000)}
        env:
        - name: SOULFRA_SERVICE
          value: "{system['name']}"
        - name: SOULFRA_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: {service_name}
  namespace: soulfra
spec:
  selector:
    app: {service_name}
  ports:
  - port: {system.get('port', 8000)}
    targetPort: {system.get('port', 8000)}
---
"""
    
    with open(f"deployment/kubernetes/{service_name}.yaml", "w") as f:
        f.write(manifest)

def generate_deployment_scripts():
    """Generate deployment scripts"""
    
    # Main deployment script
    deploy_script = """#!/bin/bash
# Soulfra Platform - Complete Deployment Script
# Generated at: {timestamp}

set -e

echo "🚀 Deploying Soulfra Platform..."
echo "================================="

# Configuration
DOMAIN="soulfra.com"
EMAIL="admin@soulfra.com"

# Check prerequisites
command -v docker >/dev/null 2>&1 || {{ echo "❌ Docker required"; exit 1; }}
command -v docker-compose >/dev/null 2>&1 || {{ echo "❌ Docker Compose required"; exit 1; }}

# Create required directories
echo "📁 Creating directories..."
sudo mkdir -p /var/www/soulfra/static
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /opt/soulfra

# Copy application files
echo "📦 Copying application files..."
sudo cp -r ../../../* /opt/soulfra/

# Build Docker images
echo "🐳 Building Docker images..."
cd deployment/docker
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL..."
docker run --rm \\
  -v /etc/letsencrypt:/etc/letsencrypt \\
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \\
  certbot/certbot certonly \\
  --standalone \\
  --email $EMAIL \\
  --agree-tos \\
  --no-eff-email \\
  -d $DOMAIN \\
  -d www.$DOMAIN

# Restart nginx with SSL
docker-compose restart nginx

echo ""
echo "✅ Soulfra Platform deployed successfully!"
echo "🌐 Access at: https://$DOMAIN"
echo ""
echo "📊 Service URLs:"
echo "  Main Platform: https://$DOMAIN/"
echo "  Games: https://$DOMAIN/games/"
echo "  Arenas: https://$DOMAIN/arena/"
echo "  Chat: https://$DOMAIN/chat/"
echo "  AI: https://$DOMAIN/ai/"
echo ""
echo "🔧 Management:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Update: git pull && docker-compose up -d --build"
""".format(timestamp=datetime.now().isoformat())
    
    with open("deployment/scripts/deploy.sh", "w") as f:
        f.write(deploy_script)
        
    os.chmod("deployment/scripts/deploy.sh", 0o755)
    
    # Create simple one-click deploy
    one_click = """#!/bin/bash
# One-click Soulfra deployment

echo "🚀 ONE-CLICK SOULFRA DEPLOYMENT"
echo "==============================="
echo ""
echo "This will deploy the complete Soulfra platform."
echo "Requirements: Docker, Docker Compose, Domain name"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./deploy.sh
else
    echo "Deployment cancelled."
fi
"""
    
    with open("deployment/scripts/one-click-deploy.sh", "w") as f:
        f.write(one_click)
        
    os.chmod("deployment/scripts/one-click-deploy.sh", 0o755)
    
    print("✅ Created deployment scripts")

def create_deployment_dashboard():
    """Create deployment status dashboard"""
    
    # Count services first
    total_services = sum(len(systems) for systems in SOULFRA_SYSTEMS.values())
    total_categories = len(SOULFRA_SYSTEMS)
    total_ports = len(set(s.get("port") for systems in SOULFRA_SYSTEMS.values() for s in systems if s.get("port")))
    
    dashboard = f"""<!DOCTYPE html>
<html>
<head>
    <title>Soulfra - Live Deployment Dashboard</title>
    <style>
        body {{
            font-family: 'Arial', sans-serif;
            background: #f0f0f0;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            text-align: center;
        }}
        .status {{
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
        }}
        .section {{
            margin: 30px 0;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 5px;
        }}
        .service-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .service-card {{
            background: white;
            padding: 20px;
            border-radius: 5px;
            border: 1px solid #ddd;
        }}
        .service-card h3 {{
            margin-top: 0;
            color: #2196F3;
        }}
        .port {{
            color: #FF5722;
            font-weight: bold;
        }}
        .deploy-button {{
            background: #2196F3;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            border-radius: 5px;
            cursor: pointer;
            display: block;
            margin: 20px auto;
        }}
        .deploy-button:hover {{
            background: #1976D2;
        }}
        pre {{
            background: #333;
            color: #0f0;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Soulfra Live Deployment</h1>
        <p style="text-align: center;">
            <span class="status">Ready to Deploy</span>
        </p>
        
        <div class="section">
            <h2>📋 Deployment Overview</h2>
            <p>The complete Soulfra platform includes:</p>
            <ul>
                <li><strong>{total_services}</strong> services across {total_categories} categories</li>
                <li><strong>{total_ports}</strong> unique ports configured</li>
                <li>Full SSL/HTTPS support</li>
                <li>Docker and Kubernetes ready</li>
                <li>Nginx reverse proxy configuration</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>🎮 Services to Deploy</h2>
            <div class="service-grid">
"""
    
    
    # Add service cards
    for category, systems in SOULFRA_SYSTEMS.items():
        for system in systems:
            port_info = f'<span class="port">Port {system.get("port", "N/A")}</span>' if system.get("port") else "No port"
            dashboard += f"""
                <div class="service-card">
                    <h3>{system['name']}</h3>
                    <p>{system['description']}</p>
                    <p>{port_info}</p>
                    <p><small>{system['file']}</small></p>
                </div>
"""
    
    dashboard += f"""
            </div>
        </div>
        
        <div class="section">
            <h2>🚀 Quick Deploy</h2>
            <p>Deploy everything with one command:</p>
            <pre>bash deployment/scripts/one-click-deploy.sh</pre>
            
            <button class="deploy-button" onclick="alert('Run the command above in your terminal')">
                Deploy Now
            </button>
        </div>
        
        <div class="section">
            <h2>📁 Deployment Files Created</h2>
            <ul>
                <li>✅ <code>deployment/nginx/soulfra.conf</code> - Nginx configuration</li>
                <li>✅ <code>deployment/docker/docker-compose.yml</code> - Docker Compose</li>
                <li>✅ <code>deployment/kubernetes/</code> - K8s manifests</li>
                <li>✅ <code>deployment/scripts/deploy.sh</code> - Deployment script</li>
                <li>✅ <code>deployment/scripts/one-click-deploy.sh</code> - Easy deploy</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>🌐 After Deployment</h2>
            <p>Your services will be available at:</p>
            <ul>
                <li><strong>Main Platform:</strong> https://soulfra.com/</li>
                <li><strong>Games:</strong> https://soulfra.com/games/</li>
                <li><strong>Arenas:</strong> https://soulfra.com/arena/</li>
                <li><strong>Chat:</strong> https://soulfra.com/chat/</li>
                <li><strong>AI Systems:</strong> https://soulfra.com/ai/</li>
                <li><strong>API:</strong> https://soulfra.com/api/</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""
    
    # Replace placeholders manually to avoid format string issues
    dashboard = dashboard.replace("{total_services}", str(total_services))
    dashboard = dashboard.replace("{total_categories}", str(total_categories))
    dashboard = dashboard.replace("{total_ports}", str(total_ports))
    
    with open("deployment/deployment_dashboard.html", "w") as f:
        f.write(dashboard)
        
    return os.path.abspath("deployment/deployment_dashboard.html")

# Main execution
if __name__ == "__main__":
    print("\n📦 Creating deployment structure...")
    create_deployment_structure()
    
    print("\n🔧 Generating configurations...")
    generate_nginx_config()
    generate_docker_compose()
    generate_kubernetes_manifests()
    generate_deployment_scripts()
    
    dashboard_path = create_deployment_dashboard()
    
    print("\n" + "=" * 60)
    print("✅ SOULFRA LIVE DEPLOYMENT READY!")
    print("=" * 60)
    
    print("\n📋 What was created:")
    print("  • Nginx configuration for all services")
    print("  • Docker Compose for containerized deployment")
    print("  • Kubernetes manifests for cloud deployment")
    print("  • Deployment scripts for easy setup")
    print("  • Status dashboard")
    
    print("\n🚀 TO DEPLOY:")
    print("  1. Review configurations in deployment/")
    print("  2. Set your domain in deployment/scripts/deploy.sh")
    print("  3. Run: bash deployment/scripts/one-click-deploy.sh")
    
    print(f"\n📊 Dashboard: {dashboard_path}")
    
    # Open dashboard
    import subprocess
    subprocess.run(['open', dashboard_path])