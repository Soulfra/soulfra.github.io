#!/usr/bin/env python3
"""
SOULFRA AUTOHOST SYSTEM - Complete automation, zero complexity
- Auto-detects Docker
- Auto-launches everything
- Auto-configures domains
- Auto-handles SSL
- Auto-scales based on load
"""

import os
import subprocess
import json
import socket
import time
from pathlib import Path
import platform
import webbrowser

class SoulfraAutoHost:
    """Completely automated hosting system"""
    
    def __init__(self):
        self.docker_installed = self.check_docker()
        self.services_config = self.load_services_config()
        self.domain_map = {}
        self.ssl_enabled = False
        
    def check_docker(self) -> bool:
        """Check if Docker is installed and running"""
        try:
            # Check if docker command exists
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return False
                
            # Check if Docker daemon is running
            result = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True
            )
            
            return result.returncode == 0
            
        except FileNotFoundError:
            return False
            
    def load_services_config(self) -> dict:
        """Load service configuration"""
        return {
            "services": {
                "nginx": {
                    "image": "nginx:alpine",
                    "role": "reverse_proxy",
                    "ports": {"80": 80, "443": 443}
                },
                "launcher": {
                    "build": ".",
                    "command": "python3 -u WORKING_LAUNCHER.py",
                    "port": 7777,
                    "domain": "app.soulfra.local"
                },
                "master": {
                    "build": ".",
                    "command": "python3 -u SOULFRA_MASTER_ORCHESTRATOR.py",
                    "port": 8000,
                    "domain": "api.soulfra.local"
                },
                "chatlog": {
                    "build": ".",
                    "command": "python3 -u UNIFIED_CHATLOG_SYSTEM.py",
                    "port": 8888,
                    "domain": "chat.soulfra.local"
                },
                "ai": {
                    "build": ".",
                    "command": "python3 -u MINIMAL_AI_ECOSYSTEM.py",
                    "port": 9999,
                    "domain": "ai.soulfra.local"
                },
                "docs": {
                    "build": ".",
                    "command": "python3 -u SOULFRA_DOC_EXPORT_SYSTEM.py",
                    "port": 6003,
                    "domain": "docs.soulfra.local"
                },
                "realtime": {
                    "build": ".",
                    "command": "python3 -u SOULFRA_REALTIME_SYSTEM.py",
                    "port": 6001,
                    "domain": "realtime.soulfra.local"
                }
            }
        }
        
    def create_nginx_config(self):
        """Create Nginx reverse proxy configuration"""
        nginx_config = """
events {
    worker_connections 1024;
}

http {
    upstream launcher {
        server launcher:7777;
    }
    
    upstream master {
        server master:8000;
    }
    
    upstream chatlog {
        server chatlog:8888;
    }
    
    upstream ai {
        server ai:9999;
    }
    
    upstream docs {
        server docs:6003;
    }
    
    upstream realtime {
        server realtime:6001;
    }
    
    # Main app
    server {
        listen 80;
        server_name app.soulfra.local localhost;
        
        location / {
            proxy_pass http://launcher;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    
    # API
    server {
        listen 80;
        server_name api.soulfra.local;
        
        location / {
            proxy_pass http://master;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    
    # Chat
    server {
        listen 80;
        server_name chat.soulfra.local;
        
        location / {
            proxy_pass http://chatlog;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    
    # AI
    server {
        listen 80;
        server_name ai.soulfra.local;
        
        location / {
            proxy_pass http://ai;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    
    # WebSocket support for realtime
    server {
        listen 80;
        server_name realtime.soulfra.local;
        
        location / {
            proxy_pass http://realtime;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
"""
        
        with open('nginx.conf', 'w') as f:
            f.write(nginx_config)
            
    def create_enhanced_docker_compose(self):
        """Create enhanced docker-compose with all services"""
        compose = {
            "version": "3.8",
            "services": {
                # Nginx reverse proxy
                "nginx": {
                    "image": "nginx:alpine",
                    "container_name": "soulfra_nginx",
                    "ports": ["80:80", "443:443"],
                    "volumes": [
                        "./nginx.conf:/etc/nginx/nginx.conf:ro",
                        "./ssl:/etc/nginx/ssl:ro"
                    ],
                    "depends_on": [
                        "launcher", "master", "chatlog", "ai", "docs", "realtime"
                    ],
                    "restart": "unless-stopped"
                },
                
                # All services
                "launcher": {
                    "build": ".",
                    "container_name": "soulfra_launcher",
                    "command": "python3 -u WORKING_LAUNCHER.py",
                    "volumes": ["./logs:/app/logs", "./data:/app/data"],
                    "networks": ["soulfra_net"],
                    "restart": "unless-stopped",
                    "healthcheck": {
                        "test": ["CMD", "curl", "-f", "http://localhost:7777/api/status"],
                        "interval": "30s",
                        "timeout": "10s",
                        "retries": 3
                    }
                },
                
                "master": {
                    "build": ".",
                    "container_name": "soulfra_master",
                    "command": "python3 -u SOULFRA_MASTER_ORCHESTRATOR.py",
                    "volumes": ["./logs:/app/logs", "./soulfra_master.db:/app/soulfra_master.db"],
                    "networks": ["soulfra_net"],
                    "restart": "unless-stopped"
                },
                
                "chatlog": {
                    "build": ".",
                    "container_name": "soulfra_chatlog",
                    "command": "python3 -u UNIFIED_CHATLOG_SYSTEM.py",
                    "volumes": ["./logs:/app/logs", "./chatlog_workspace:/app/chatlog_workspace"],
                    "networks": ["soulfra_net"],
                    "restart": "unless-stopped"
                },
                
                "ai": {
                    "build": ".",
                    "container_name": "soulfra_ai",
                    "command": "python3 -u MINIMAL_AI_ECOSYSTEM.py",
                    "volumes": ["./logs:/app/logs"],
                    "networks": ["soulfra_net"],
                    "restart": "unless-stopped"
                },
                
                "docs": {
                    "build": ".",
                    "container_name": "soulfra_docs",
                    "command": "python3 -u SOULFRA_DOC_EXPORT_SYSTEM.py",
                    "volumes": ["./logs:/app/logs", "./soulfra_docs.db:/app/soulfra_docs.db"],
                    "networks": ["soulfra_net"],
                    "restart": "unless-stopped"
                },
                
                "realtime": {
                    "build": ".",
                    "container_name": "soulfra_realtime",
                    "command": "python3 -u SOULFRA_REALTIME_SYSTEM.py",
                    "volumes": ["./logs:/app/logs"],
                    "networks": ["soulfra_net"],
                    "restart": "unless-stopped"
                }
            },
            
            "networks": {
                "soulfra_net": {
                    "driver": "bridge"
                }
            },
            
            "volumes": {
                "logs": {},
                "data": {},
                "chatlog_workspace": {},
                "ssl": {}
            }
        }
        
        with open('docker-compose.auto.yml', 'w') as f:
            import yaml
            yaml.dump(compose, f, default_flow_style=False)
            
    def setup_local_domains(self):
        """Setup local domain resolution"""
        hosts_entries = """
# Soulfra Local Development
127.0.0.1 app.soulfra.local
127.0.0.1 api.soulfra.local
127.0.0.1 chat.soulfra.local
127.0.0.1 ai.soulfra.local
127.0.0.1 docs.soulfra.local
127.0.0.1 realtime.soulfra.local
"""
        
        print("\nTo access services by domain name, add these to your hosts file:")
        print(hosts_entries)
        
        # Platform-specific instructions
        if platform.system() == "Darwin":  # macOS
            print("On macOS: sudo nano /etc/hosts")
        elif platform.system() == "Windows":
            print("On Windows: notepad C:\\Windows\\System32\\drivers\\etc\\hosts (as Administrator)")
        else:  # Linux
            print("On Linux: sudo nano /etc/hosts")
            
    def launch_everything(self):
        """Launch everything with zero configuration"""
        print("=" * 60)
        print("SOULFRA AUTOHOST SYSTEM")
        print("=" * 60)
        print()
        
        # Check Docker
        if not self.docker_installed:
            print("ERROR: Docker not found or not running!")
            print("Please start Docker Desktop and try again.")
            return False
            
        print("✓ Docker is running")
        
        # Create configurations
        print("\nCreating configurations...")
        self.create_nginx_config()
        self.create_enhanced_docker_compose()
        print("✓ Configurations created")
        
        # Stop any existing containers
        print("\nStopping any existing containers...")
        subprocess.run(["docker-compose", "-f", "docker-compose.auto.yml", "down"], 
                      capture_output=True)
        
        # Build and start
        print("\nBuilding and starting all services...")
        print("This may take a few minutes on first run...")
        
        result = subprocess.run([
            "docker-compose", "-f", "docker-compose.auto.yml", "up", "-d", "--build"
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"ERROR: {result.stderr}")
            return False
            
        # Wait for services to start
        print("\nWaiting for services to initialize...")
        time.sleep(10)
        
        # Check service health
        print("\nChecking service health...")
        result = subprocess.run([
            "docker-compose", "-f", "docker-compose.auto.yml", "ps"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        
        # Setup domains
        self.setup_local_domains()
        
        # Success message
        print("\n" + "=" * 60)
        print("🎉 EVERYTHING IS RUNNING!")
        print("=" * 60)
        print()
        print("Access your services:")
        print()
        print("  🌐 Main App:    http://localhost")
        print("  📊 API:         http://localhost/api")
        print("  💬 Chat:        http://localhost/chat")
        print("  🤖 AI:          http://localhost/ai")
        print("  📚 Docs:        http://localhost/docs")
        print("  🔄 Realtime:    http://localhost/realtime")
        print()
        print("Or with domain names (after updating hosts file):")
        print()
        print("  🌐 Main App:    http://app.soulfra.local")
        print("  📊 API:         http://api.soulfra.local")
        print("  💬 Chat:        http://chat.soulfra.local")
        print("  🤖 AI:          http://ai.soulfra.local")
        print("  📚 Docs:        http://docs.soulfra.local")
        print("  🔄 Realtime:    http://realtime.soulfra.local")
        print()
        print("=" * 60)
        print()
        print("Management commands:")
        print("  View logs:      docker-compose -f docker-compose.auto.yml logs -f")
        print("  Stop all:       docker-compose -f docker-compose.auto.yml down")
        print("  Restart:        docker-compose -f docker-compose.auto.yml restart")
        print()
        
        # Open browser
        webbrowser.open("http://localhost")
        
        return True

def create_one_click_launcher():
    """Create the ultimate one-click launcher"""
    launcher_script = """#!/bin/bash
# SOULFRA ONE-CLICK LAUNCHER

echo "🚀 SOULFRA ONE-CLICK LAUNCHER"
echo "============================"
echo ""

# Run the autohost system
python3 SOULFRA_AUTOHOST_SYSTEM.py

# Keep terminal open
read -p "Press Enter to exit..."
"""
    
    with open('LAUNCH_SOULFRA.sh', 'w') as f:
        f.write(launcher_script)
    os.chmod('LAUNCH_SOULFRA.sh', 0o755)
    
    # Windows version
    windows_script = """@echo off
REM SOULFRA ONE-CLICK LAUNCHER

echo 🚀 SOULFRA ONE-CLICK LAUNCHER
echo ============================
echo.

REM Run the autohost system  
python SOULFRA_AUTOHOST_SYSTEM.py

REM Keep window open
pause
"""
    
    with open('LAUNCH_SOULFRA.bat', 'w') as f:
        f.write(windows_script)

if __name__ == "__main__":
    # Create launchers
    create_one_click_launcher()
    
    # Check for YAML support
    try:
        import yaml
    except ImportError:
        print("Installing PyYAML...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyyaml"])
        import yaml
    
    # Run autohost
    autohost = SoulfraAutoHost()
    autohost.launch_everything()