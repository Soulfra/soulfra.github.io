#!/usr/bin/env python3
"""
ULTIMATE LAUNCHER - Launch the complete maxed-out Soulfra experience
Everything at maximum immersion level
"""

import os
import sys
import time
import socket
import subprocess
import urllib.request
from pathlib import Path

class UltimateLauncher:
    """Launch the full immersive Soulfra ecosystem"""
    
    def __init__(self):
        self.services = {
            'immersion': {
                'file': 'MAXED_IMMERSION.py',
                'port': 5555,
                'name': '🧠 Neural Immersion Platform',
                'url': 'http://localhost:5555',
                'description': 'Full Matrix experience with neural sync'
            },
            'main': {
                'file': 'SOULFRA_WORKING_NOW.py',
                'port': 3333,
                'name': '🔥 Main Soulfra Platform',
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
        
    def print_ultimate_header(self):
        print("🌌 ULTIMATE SOULFRA EXPERIENCE LAUNCHER")
        print("=" * 80)
        print("MAXIMUM IMMERSION • COMPLETE ECOSYSTEM • NEURAL SYNC ACTIVATED")
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
        print("-" * 60)
        
        # Check file
        if not os.path.exists(service['file']):
            print(f"❌ CRITICAL: {service['file']} not found!")
            return False
        print(f"✅ File ready: {service['file']}")
        
        # Clear port
        if self.check_port(service['port']):
            print(f"⚠️  Clearing port {service['port']}...")
            self.kill_port(service['port'])
        else:
            print(f"✅ Port {service['port']} available")
            
        # Launch
        print(f"📦 Starting neural process...")
        try:
            process = subprocess.Popen(
                [sys.executable, service['file']],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
            
            print(f"✅ Process initiated (PID: {process.pid})")
            
        except Exception as e:
            print(f"❌ LAUNCH FAILED: {e}")
            return False
            
        # Verify activation
        print("⏳ Neural handshake in progress...")
        for i in range(20):  # 20 seconds max
            if self.test_service(service['port']):
                print(f"✅ NEURAL LINK ESTABLISHED!")
                print(f"🌐 Interface: {service['url']}")
                print()
                return True
                
            print(f"   ⏳ Synchronizing... ({i+1}/20)")
            time.sleep(1)
            
        print(f"❌ Neural handshake failed after 20 seconds")
        return False
        
    def get_ecosystem_status(self):
        print("📊 ULTIMATE ECOSYSTEM STATUS")
        print("=" * 80)
        
        all_active = True
        for key, service in self.services.items():
            if self.test_service(service['port']):
                print(f"✅ {service['name']:30} | ACTIVE | {service['url']}")
            else:
                print(f"❌ {service['name']:30} | OFFLINE | {service['url']}")
                all_active = False
                
        print()
        return all_active
        
    def launch_ultimate_experience(self):
        self.clear_screen()
        self.print_ultimate_header()
        
        # Kill any existing processes
        print("🧹 NEURAL SYSTEM CLEANUP...")
        for service in self.services.values():
            self.kill_port(service['port'])
        print("✅ All neural pathways cleared")
        print()
        
        # Launch in optimal order for maximum impact
        launch_order = ['immersion', 'main', 'arena']
        success_count = 0
        
        for key in launch_order:
            if self.launch_service(key):
                success_count += 1
            else:
                print(f"💀 {self.services[key]['name']} FAILED")
                print()
                
        # Final status report
        print("🎯 ULTIMATE ECOSYSTEM ACTIVATION COMPLETE")
        print("=" * 80)
        
        if self.get_ecosystem_status():
            print("🌌 FULL NEURAL CONSCIOUSNESS ACHIEVED!")
            print("🔥 THE ULTIMATE SOULFRA EXPERIENCE IS LIVE!")
            print()
            print("🎮 RECOMMENDED EXPERIENCE ORDER:")
            print("   1. 🧠 Neural Immersion (localhost:5555) - START HERE")
            print("   2. 🔥 Main Platform (localhost:3333) - Core features") 
            print("   3. ⚔️ AI Arena (localhost:4444) - Battle zone")
            print()
            print("🚀 MAXIMUM IMMERSION FEATURES:")
            print("   ✅ Matrix rain visual effects")
            print("   ✅ Real-time neural sync animation")
            print("   ✅ Live consciousness monitoring")
            print("   ✅ Immersive sound effects")
            print("   ✅ Quantum betting with reality distortion")
            print("   ✅ Consciousness amplification controls")
            print("   ✅ Live event streams")
            print("   ✅ Neural battle arena integration")
            print()
            print("💡 USERS WILL FEEL LIKE THEY'RE IN THE MATRIX!")
            print("   Complete sensory overload and neural immersion")
            
        else:
            print("⚠️  Some neural pathways failed to activate")
            print("🔧 Run again to retry failed connections")
            
        return success_count == len(self.services)

def main():
    launcher = UltimateLauncher()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'status':
            launcher.clear_screen()
            launcher.print_ultimate_header()
            launcher.get_ecosystem_status()
        elif command == 'launch':
            launcher.launch_ultimate_experience()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python3 ULTIMATE_LAUNCHER.py [launch|status]")
    else:
        # Default: launch the ultimate experience
        launcher.launch_ultimate_experience()

if __name__ == '__main__':
    main()