#!/usr/bin/env python3
"""
SAFE UNIVERSE LAUNCHER - Use browser-safe ports
Fixed the unsafe port issue - everything on safe ports now
"""

import os
import sys
import time
import socket
import subprocess
import urllib.request

class SafeUniverseLauncher:
    """Launch universe on browser-safe ports"""
    
    def __init__(self):
        self.services = {
            'universe': {
                'file': 'ULTIMATE_SOULFRA_UNIVERSE.py',
                'port': 8765,
                'name': '🌌 Ultimate Universe Portal',
                'url': 'http://localhost:8765',
                'description': 'Master control center - ALL SYSTEMS CONNECTED'
            },
            'main': {
                'file': 'SOULFRA_WORKING_NOW.py',
                'port': 3333,
                'name': '🔥 Core Platform Engine',
                'url': 'http://localhost:3333',
                'description': 'Sacred handoffs, NBA betting, core features'
            },
            'arena': {
                'file': 'AI_VS_AI_ARENA.py', 
                'port': 4444,
                'name': '⚔️ AI Battle Arena',
                'url': 'http://localhost:4444',
                'description': 'High-stakes AI battles and dicing'
            }
        }
        
    def clear_screen(self):
        os.system('clear' if os.name == 'posix' else 'cls')
        
    def print_safe_header(self):
        print("🌌 SAFE UNIVERSE LAUNCHER - BROWSER-SAFE PORTS")
        print("=" * 80)
        print("ULTIMATE SOULFRA EXPERIENCE • MAXIMUM IMMERSION • SAFE ACCESS")
        print("=" * 80)
        print()
        
    def check_port(self, port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            return sock.connect_ex(('localhost', port)) == 0
            
    def test_service(self, port):
        try:
            response = urllib.request.urlopen(f'http://localhost:{port}', timeout=5)
            return response.status == 200
        except:
            return False
            
    def kill_port(self, port):
        try:
            result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                  capture_output=True, text=True, timeout=5)
            if result.stdout.strip():
                pid = result.stdout.strip()
                subprocess.run(['kill', '-9', pid], timeout=5)
                print(f"   🔥 Cleared port {port}")
                time.sleep(1)
        except:
            pass
            
    def launch_service(self, service_key):
        service = self.services[service_key]
        
        print(f"🚀 LAUNCHING {service['name']}")
        print(f"   📝 {service['description']}")
        print(f"   🔌 Port: {service['port']} (BROWSER SAFE)")
        print("-" * 70)
        
        # Check file exists
        if not os.path.exists(service['file']):
            print(f"❌ CRITICAL: {service['file']} not found!")
            return False
        print(f"✅ Service file ready: {service['file']}")
        
        # Clear port if needed
        if self.check_port(service['port']):
            print(f"⚠️  Clearing port {service['port']}...")
            self.kill_port(service['port'])
        else:
            print(f"✅ Port {service['port']} available")
            
        # Launch the service
        print(f"📦 Starting process...")
        try:
            process = subprocess.Popen(
                [sys.executable, service['file']],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
            
            print(f"✅ Process started (PID: {process.pid})")
            
        except Exception as e:
            print(f"❌ LAUNCH FAILED: {e}")
            return False
            
        # Wait for service to respond
        print("⏳ Waiting for service...")
        for i in range(20):
            if self.test_service(service['port']):
                print(f"✅ SERVICE IS LIVE!")
                print(f"🌐 Access: {service['url']}")
                print()
                return True
                
            print(f"   ⏳ Starting... ({i+1}/20)")
            time.sleep(1)
            
        print(f"❌ Service failed to start after 20 seconds")
        return False
        
    def get_status(self):
        print("📊 UNIVERSE STATUS - SAFE PORTS")
        print("=" * 70)
        
        all_active = True
        for key, service in self.services.items():
            if self.test_service(service['port']):
                print(f"✅ {service['name']:30} | LIVE | {service['url']}")
            else:
                print(f"❌ {service['name']:30} | DOWN | {service['url']}")
                all_active = False
                
        print()
        return all_active
        
    def launch_safe_universe(self):
        self.clear_screen()
        self.print_safe_header()
        
        # Kill any existing processes
        print("🧹 CLEANING UP...")
        for service in self.services.values():
            self.kill_port(service['port'])
        print("✅ All ports cleared")
        print()
        
        # Launch in order
        success_count = 0
        for key in ['universe', 'main', 'arena']:
            if self.launch_service(key):
                success_count += 1
            else:
                print(f"💀 {self.services[key]['name']} FAILED")
                print()
                
        # Final status
        print("🎯 LAUNCH COMPLETE")
        print("=" * 70)
        
        if self.get_status():
            print("🌌 ULTIMATE UNIVERSE IS LIVE!")
            print("🔥 BROWSER-SAFE PORTS - NO MORE UNSAFE WARNINGS!")
            print()
            print("🎮 EXPERIENCE ORDER:")
            print("   1. 🌌 Universe Portal (localhost:8765) - START HERE")
            print("      Portal matrix to everything - full immersion")
            print("   2. 🔥 Core Platform (localhost:3333) - Main features") 
            print("   3. ⚔️ AI Arena (localhost:4444) - Battle zone")
            print()
            print("🚀 IMMERSION FEATURES:")
            print("   ✅ Animated starfield background")
            print("   ✅ Portal matrix to all systems")
            print("   ✅ Live consciousness tracking")
            print("   ✅ Real-time universe events")
            print("   ✅ AI marketplace integration")
            print("   ✅ Sacred documents access")
            print("   ✅ High-stakes arena battles")
            print("   ✅ Complete visual immersion")
            print()
            print("💡 USERS WILL FEEL LIKE THEY'RE IN THE MATRIX!")
            
        else:
            print("⚠️  Some services failed to start")
            print("🔧 Try running again")
            
        return success_count == len(self.services)

def main():
    launcher = SafeUniverseLauncher()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'status':
            launcher.clear_screen()
            launcher.print_safe_header()
            launcher.get_status()
        else:
            launcher.launch_safe_universe()
    else:
        launcher.launch_safe_universe()

if __name__ == '__main__':
    main()