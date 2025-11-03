#!/usr/bin/env python3
"""
SOULFRA LAUNCHER - No more timeout confusion
Proper process management with immediate feedback
"""

import os
import sys
import time
import signal
import subprocess
import urllib.request
from pathlib import Path

class SoulframLauncher:
    """Smart launcher that gives immediate feedback"""
    
    def __init__(self):
        self.services = {
            'soulfra': {
                'file': 'WORKING_SOULFRA_NOW.py',
                'port': 5555,
                'name': '🔥 Main Soulfra Platform'
            },
            'nba': {
                'file': 'NBA_BETTING_PLATFORM.py', 
                'port': 7777,
                'name': '🏀 NBA Betting'
            },
            'simple': {
                'file': 'SIMPLE_WORKING_SOULFRA.py',
                'port': 8800,
                'name': '⚡ Simple Platform'
            }
        }
    
    def start_service(self, service_name):
        """Start a service with immediate feedback"""
        if service_name not in self.services:
            print(f"❌ Unknown service: {service_name}")
            return False
            
        service = self.services[service_name]
        
        print(f"🚀 Starting {service['name']}...")
        
        # Check if file exists
        if not os.path.exists(service['file']):
            print(f"❌ File not found: {service['file']}")
            return False
        
        # Check if port is already in use
        if self.is_port_used(service['port']):
            print(f"⚠️  Port {service['port']} already in use")
            if self.test_service(service['port']):
                print(f"✅ {service['name']} already running at http://localhost:{service['port']}")
                return True
            else:
                print(f"🔧 Killing process on port {service['port']}...")
                self.kill_port(service['port'])
                time.sleep(2)
        
        # Start the service
        print(f"📦 Launching {service['file']}...")
        try:
            process = subprocess.Popen(
                [sys.executable, service['file']],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                preexec_fn=os.setsid
            )
            
            # Wait for startup (max 10 seconds)
            for i in range(10):
                time.sleep(1)
                if self.test_service(service['port']):
                    print(f"✅ {service['name']} is live!")
                    print(f"🌐 Access: http://localhost:{service['port']}")
                    return True
                print(f"⏳ Waiting for startup... ({i+1}/10)")
            
            print(f"❌ {service['name']} failed to start")
            return False
            
        except Exception as e:
            print(f"❌ Failed to start: {e}")
            return False
    
    def is_port_used(self, port):
        """Check if port is in use"""
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0
    
    def test_service(self, port):
        """Test if service is responding"""
        try:
            response = urllib.request.urlopen(f'http://localhost:{port}', timeout=3)
            return response.status == 200
        except:
            return False
    
    def kill_port(self, port):
        """Kill process on specific port"""
        try:
            result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
            if result.stdout.strip():
                pid = result.stdout.strip()
                subprocess.run(['kill', '-9', pid])
        except:
            pass
    
    def status(self):
        """Show status of all services"""
        print("\n📊 SOULFRA SERVICES STATUS")
        print("=" * 50)
        
        for name, service in self.services.items():
            port = service['port']
            if self.test_service(port):
                print(f"✅ {service['name']:30} | http://localhost:{port}")
            else:
                print(f"❌ {service['name']:30} | Not running")
        
        print()
    
    def kill_all(self):
        """Kill all running services"""
        print("🛑 Stopping all Soulfra services...")
        
        for name, service in self.services.items():
            if self.is_port_used(service['port']):
                print(f"🔥 Killing {service['name']}...")
                self.kill_port(service['port'])
        
        time.sleep(2)
        print("✅ All services stopped")

def main():
    launcher = SoulframLauncher()
    
    if len(sys.argv) < 2:
        print("🚀 SOULFRA LAUNCHER")
        print("=" * 40)
        print("Usage:")
        print("  python3 SOULFRA_LAUNCHER.py start <service>")
        print("  python3 SOULFRA_LAUNCHER.py status")
        print("  python3 SOULFRA_LAUNCHER.py kill")
        print()
        print("Available services:")
        print("  soulfra  - Main platform (port 5555)")
        print("  nba      - NBA betting (port 7777)")  
        print("  simple   - Simple platform (port 8800)")
        print()
        print("Examples:")
        print("  python3 SOULFRA_LAUNCHER.py start soulfra")
        print("  python3 SOULFRA_LAUNCHER.py status")
        return
    
    command = sys.argv[1]
    
    if command == 'start':
        if len(sys.argv) < 3:
            print("❌ Please specify service to start")
            return
        service = sys.argv[2]
        launcher.start_service(service)
        
    elif command == 'status':
        launcher.status()
        
    elif command == 'kill':
        launcher.kill_all()
        
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == '__main__':
    main()