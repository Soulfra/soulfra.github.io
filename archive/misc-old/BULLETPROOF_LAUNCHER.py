#!/usr/bin/env python3
"""
BULLETPROOF LAUNCHER - No more timeout confusion EVER
Crystal clear feedback, instant status, unfuckable system
"""

import os
import sys
import time
import socket
import signal
import subprocess
import urllib.request
from pathlib import Path

class BulletproofLauncher:
    """Launcher that makes everything crystal fucking clear"""
    
    def __init__(self):
        self.services = {
            'main': {
                'file': 'SOULFRA_WORKING_NOW.py',
                'port': 3333,
                'name': '🔥 Main Soulfra Platform',
                'url': 'http://localhost:3333'
            },
            'arena': {
                'file': 'AI_VS_AI_ARENA.py', 
                'port': 4444,
                'name': '⚔️ AI Arena',
                'url': 'http://localhost:4444'
            }
        }
        
        self.pids = {}
        
    def clear_screen(self):
        """Clear terminal for clean output"""
        os.system('clear' if os.name == 'posix' else 'cls')
        
    def print_header(self):
        """Print clear header"""
        print("🚀 BULLETPROOF SOULFRA LAUNCHER")
        print("=" * 80)
        print("NO MORE TIMEOUT CONFUSION - EVERYTHING IS CRYSTAL CLEAR")
        print("=" * 80)
        print()
        
    def check_port(self, port):
        """Check if port is in use"""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            return result == 0
            
    def test_service(self, port):
        """Test if service responds to HTTP"""
        try:
            response = urllib.request.urlopen(f'http://localhost:{port}', timeout=5)
            return response.status == 200
        except:
            return False
            
    def kill_port(self, port):
        """Kill any process using the port"""
        try:
            # Find and kill process on port
            result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                  capture_output=True, text=True, timeout=5)
            if result.stdout.strip():
                pid = result.stdout.strip()
                subprocess.run(['kill', '-9', pid], timeout=5)
                print(f"   🔥 Killed old process on port {port}")
                time.sleep(2)
        except:
            pass
            
    def start_service(self, service_key):
        """Start a service with bulletproof feedback"""
        service = self.services[service_key]
        
        print(f"🚀 STARTING {service['name']}")
        print("-" * 60)
        
        # Step 1: Check file exists
        if not os.path.exists(service['file']):
            print(f"❌ CRITICAL: {service['file']} not found!")
            return False
        print(f"✅ File found: {service['file']}")
        
        # Step 2: Clear port if needed
        if self.check_port(service['port']):
            print(f"⚠️  Port {service['port']} in use - clearing it...")
            self.kill_port(service['port'])
        else:
            print(f"✅ Port {service['port']} available")
            
        # Step 3: Start the service
        print(f"📦 Launching {service['file']}...")
        try:
            process = subprocess.Popen(
                [sys.executable, service['file']],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
            
            self.pids[service_key] = process.pid
            print(f"✅ Process started (PID: {process.pid})")
            
        except Exception as e:
            print(f"❌ FAILED TO START: {e}")
            return False
            
        # Step 4: Wait for service to be ready
        print("⏳ Waiting for service to be ready...")
        for i in range(15):  # 15 seconds max
            if self.test_service(service['port']):
                print(f"✅ SERVICE IS LIVE AND RESPONDING!")
                print(f"🌐 Access: {service['url']}")
                print()
                return True
                
            print(f"   ⏳ Still starting... ({i+1}/15)")
            time.sleep(1)
            
        print(f"❌ Service failed to respond after 15 seconds")
        return False
        
    def get_status(self):
        """Get current status of all services"""
        print("📊 CURRENT SERVICE STATUS")
        print("-" * 60)
        
        all_good = True
        for key, service in self.services.items():
            if self.test_service(service['port']):
                print(f"✅ {service['name']:25} | LIVE | {service['url']}")
            else:
                print(f"❌ {service['name']:25} | DOWN | {service['url']}")
                all_good = False
                
        print()
        return all_good
        
    def launch_everything(self):
        """Launch complete ecosystem with bulletproof feedback"""
        self.clear_screen()
        self.print_header()
        
        # Kill any existing processes first
        print("🧹 CLEANING UP OLD PROCESSES...")
        for service in self.services.values():
            self.kill_port(service['port'])
        print("✅ Cleanup complete")
        print()
        
        # Start each service
        success_count = 0
        for key, service in self.services.items():
            if self.start_service(key):
                success_count += 1
            else:
                print(f"💀 {service['name']} FAILED TO START")
                print()
                
        # Final status
        print("🎯 FINAL ECOSYSTEM STATUS")
        print("=" * 80)
        
        if self.get_status():
            print("🎉 ALL SYSTEMS OPERATIONAL!")
            print("🔥 THE COMPLETE SOULFRA ECOSYSTEM IS LIVE!")
            print()
            print("💡 IMPORTANT: If you see 'timeout' messages in Claude Code,")
            print("   that's NORMAL - the servers keep running in background!")
            print("   Just check the URLs above to confirm they're working.")
            print()
            print("🚀 READY FOR NBA BETTING AND AI ARENA BATTLES!")
            
        else:
            print("⚠️  Some services failed to start")
            print("🔧 Try running again or check the logs")
            
        return success_count == len(self.services)
        
    def stop_everything(self):
        """Stop all services"""
        print("🛑 STOPPING ALL SERVICES...")
        
        for key, service in self.services.items():
            if key in self.pids:
                try:
                    os.kill(self.pids[key], signal.SIGTERM)
                    print(f"✅ Stopped {service['name']}")
                except:
                    pass
                    
            self.kill_port(service['port'])
            
        print("✅ All services stopped")

def main():
    launcher = BulletproofLauncher()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'start':
            launcher.launch_everything()
        elif command == 'stop':
            launcher.stop_everything()
        elif command == 'status':
            launcher.clear_screen()
            launcher.print_header()
            launcher.get_status()
        else:
            print(f"Unknown command: {command}")
    else:
        # Default: launch everything
        launcher.launch_everything()

if __name__ == '__main__':
    main()