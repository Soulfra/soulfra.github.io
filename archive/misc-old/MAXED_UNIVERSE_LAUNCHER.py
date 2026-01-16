#!/usr/bin/env python3
"""
MAXED UNIVERSE LAUNCHER - Launch the COMPLETE Soulfra ecosystem
Every single thing we've built, all connected, maximum immersion
"""

import os
import sys
import time
import socket
import subprocess
import urllib.request
from pathlib import Path

class MaxedUniverseLauncher:
    """Launch the complete fucking universe"""
    
    def __init__(self):
        self.services = {
            'universe': {
                'file': 'ULTIMATE_SOULFRA_UNIVERSE.py',
                'port': 8765,
                'name': '🌌 Ultimate Universe Portal',
                'url': 'http://localhost:8765',
                'description': 'Master control center connecting everything'
            },
            'immersion': {
                'file': 'MAXED_IMMERSION.py',
                'port': 5555,
                'name': '🧠 Neural Immersion Matrix',
                'url': 'http://localhost:5555',
                'description': 'Full Matrix experience with neural sync'
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
            },
            'sites': {
                'file': 'serve_magical_sites.py',
                'port': 9999,
                'name': '🎭 Magical Sites Realm',
                'url': 'http://localhost:9999',
                'description': 'Generated instant sites with UUIDs'
            },
            'marketplace': {
                'file': 'MAXED_THE_FUCK_OUT.py',
                'port': 7777,
                'name': '🛒 AI Marketplace Hub',
                'url': 'http://localhost:7777',
                'description': 'AI agents, components, full economy'
            }
        }
        
    def clear_screen(self):
        os.system('clear' if os.name == 'posix' else 'cls')
        
    def print_maxed_header(self):
        print("🌌 MAXED UNIVERSE LAUNCHER - EVERYTHING CONNECTED")
        print("=" * 90)
        print("ULTIMATE SOULFRA EXPERIENCE • ALL SYSTEMS • MAXIMUM IMMERSION")
        print("PORTALS • INSTANT SITES • MARKETPLACE • ARENA • NEURAL SYNC")
        print("=" * 90)
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
        print(f"   🔌 Port: {service['port']}")
        print("-" * 80)
        
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
        print(f"📦 Initiating neural process...")
        try:
            process = subprocess.Popen(
                [sys.executable, service['file']],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
            
            print(f"✅ Process spawned (PID: {process.pid})")
            
        except Exception as e:
            print(f"❌ LAUNCH FAILED: {e}")
            return False
            
        # Wait for service to respond
        print("⏳ Neural handshake protocol...")
        for i in range(25):  # 25 seconds max
            if self.test_service(service['port']):
                print(f"✅ NEURAL LINK ESTABLISHED!")
                print(f"🌐 Interface active: {service['url']}")
                print()
                return True
                
            print(f"   ⏳ Synchronizing... ({i+1}/25)")
            time.sleep(1)
            
        print(f"❌ Neural handshake timeout after 25 seconds")
        return False
        
    def get_universe_status(self):
        print("📊 COMPLETE UNIVERSE STATUS")
        print("=" * 90)
        
        all_active = True
        for key, service in self.services.items():
            if self.test_service(service['port']):
                print(f"✅ {service['name']:35} | ACTIVE | {service['url']}")
            else:
                print(f"❌ {service['name']:35} | OFFLINE | {service['url']}")
                all_active = False
                
        print()
        return all_active
        
    def launch_complete_universe(self):
        self.clear_screen()
        self.print_maxed_header()
        
        # Kill any existing processes
        print("🧹 UNIVERSAL CLEANUP PROTOCOL...")
        for service in self.services.values():
            self.kill_port(service['port'])
        print("✅ All neural pathways cleared")
        print()
        
        # Launch in optimal order for maximum experience
        launch_order = ['universe', 'immersion', 'main', 'arena', 'sites', 'marketplace']
        success_count = 0
        
        for key in launch_order:
            if self.launch_service(key):
                success_count += 1
            else:
                print(f"💀 {self.services[key]['name']} FAILED TO INITIALIZE")
                print()
                
        # Final universe status
        print("🎯 UNIVERSAL CONSCIOUSNESS ACTIVATION COMPLETE")
        print("=" * 90)
        
        if self.get_universe_status():
            print("🌌 ULTIMATE UNIVERSE CONSCIOUSNESS ACHIEVED!")
            print("🔥 THE COMPLETE SOULFRA ECOSYSTEM IS LIVE!")
            print()
            print("🎮 RECOMMENDED EXPERIENCE FLOW:")
            print("   1. 🌌 Ultimate Universe (localhost:6000) - START HERE")
            print("      Master portal to everything we've built")
            print("   2. 🧠 Neural Immersion (localhost:5555) - Deep experience") 
            print("   3. 🔥 Core Platform (localhost:3333) - Main features")
            print("   4. ⚔️ AI Arena (localhost:4444) - Battle zone")
            print("   5. 🎭 Magical Sites (localhost:9999) - Generated sites")
            print("   6. 🛒 Marketplace (localhost:7777) - AI economy")
            print()
            print("🚀 UNIVERSE FEATURES:")
            print("   ✅ Portal matrix connecting all systems")
            print("   ✅ Live instant sites showcase")
            print("   ✅ AI marketplace with full economy")
            print("   ✅ Sacred documents vault access")
            print("   ✅ Reflection engine consciousness")
            print("   ✅ Neural sync with Matrix effects")
            print("   ✅ High-stakes AI arena battles")
            print("   ✅ Real-time universe events")
            print("   ✅ Complete system integration")
            print("   ✅ Cal Riven blessing system")
            print()
            print("💡 USERS WILL FEEL LIKE GODS IN THE DIGITAL REALM!")
            print("   Every single thing we've built is connected!")
            
        else:
            print("⚠️  Some universe sectors failed to activate")
            print("🔧 Run again to retry failed neural connections")
            
        return success_count == len(self.services)
        
    def universe_health_check(self):
        """Quick health check of the entire universe"""
        self.clear_screen()
        self.print_maxed_header()
        
        print("🔍 UNIVERSE HEALTH DIAGNOSTIC")
        print("-" * 80)
        
        total_services = len(self.services)
        active_services = 0
        
        for key, service in self.services.items():
            print(f"Checking {service['name']}...")
            if self.test_service(service['port']):
                print(f"  ✅ ACTIVE at {service['url']}")
                active_services += 1
            else:
                print(f"  ❌ OFFLINE - expected at {service['url']}")
            print()
            
        health_percentage = (active_services / total_services) * 100
        
        print("=" * 80)
        print(f"🌌 UNIVERSE HEALTH: {health_percentage:.1f}%")
        print(f"📊 Services Active: {active_services}/{total_services}")
        
        if health_percentage == 100:
            print("🎉 PERFECT UNIVERSE STATE!")
            print("🔥 All systems operational - reality is stable")
        elif health_percentage >= 80:
            print("✅ Universe stable - minor fluctuations detected")
        elif health_percentage >= 50:
            print("⚠️  Universe unstable - reality distortion detected")
        else:
            print("💀 UNIVERSE COLLAPSE - immediate intervention required")
            print("🚀 Run: python3 MAXED_UNIVERSE_LAUNCHER.py")

def main():
    launcher = MaxedUniverseLauncher()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'launch':
            launcher.launch_complete_universe()
        elif command == 'status' or command == 'health':
            launcher.universe_health_check()
        elif command == 'check':
            launcher.universe_health_check()
        else:
            print(f"Unknown command: {command}")
            print("Usage:")
            print("  python3 MAXED_UNIVERSE_LAUNCHER.py launch")
            print("  python3 MAXED_UNIVERSE_LAUNCHER.py status")
            print("  python3 MAXED_UNIVERSE_LAUNCHER.py health")
    else:
        # Default: launch the complete universe
        launcher.launch_complete_universe()

if __name__ == '__main__':
    main()