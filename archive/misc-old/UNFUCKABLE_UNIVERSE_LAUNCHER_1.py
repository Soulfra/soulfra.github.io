#!/usr/bin/env python3
"""
UNFUCKABLE UNIVERSE LAUNCHER - Uses smart port management
No more port conflicts, automatic fallbacks, bulletproof system
"""

import os
import sys
import time
import subprocess
import urllib.request
from UNFUCKABLE_PORT_MANAGER import UnfuckablePortManager

class UnfuckableUniverseLauncher:
    """Launcher that uses smart port management"""
    
    def __init__(self):
        self.port_manager = UnfuckablePortManager()
        
        self.services = {
            'universe': {
                'file': 'ULTIMATE_SOULFRA_UNIVERSE.py',
                'name': '🌌 Ultimate Universe Portal',
                'description': 'Master portal connecting everything'
            },
            'automation': {
                'file': 'AUTOMATED_FIGHT_LAYER.py',
                'name': '🤖 Automated Fight Layer',
                'description': 'AI vs AI automation - THE SYSTEM RUNS ITSELF'
            },
            'main': {
                'file': 'SOULFRA_WORKING_NOW.py',
                'name': '🔥 Core Platform Engine', 
                'description': 'Sacred handoffs, NBA betting, core features'
            },
            'arena': {
                'file': 'AI_VS_AI_ARENA.py',
                'name': '⚔️ AI Battle Arena',
                'description': 'High-stakes AI battles and dicing'
            }
        }
        
    def clear_screen(self):
        os.system('clear' if os.name == 'posix' else 'cls')
        
    def print_unfuckable_header(self):
        print("🚀 UNFUCKABLE UNIVERSE LAUNCHER")
        print("=" * 80)
        print("SMART PORT MANAGEMENT • NO CONFLICTS • BULLETPROOF SYSTEM")
        print("=" * 80)
        print()
        
    def test_service(self, port):
        """Test if service responds"""
        try:
            response = urllib.request.urlopen(f'http://localhost:{port}', timeout=5)
            return response.status == 200
        except:
            return False
            
    def update_service_port(self, service_file, new_port):
        """Update the port in a service file"""
        try:
            with open(service_file, 'r') as f:
                content = f.read()
                
            # Find and replace the port
            import re
            
            # Pattern for HTTPServer(('localhost', PORT), Handler)
            pattern = r"HTTPServer\(\('localhost',\s*(\d+)\)"
            replacement = f"HTTPServer(('localhost', {new_port})"
            content = re.sub(pattern, replacement, content)
            
            # Pattern for print statements with URLs
            pattern = r"http://localhost:\d+"
            replacement = f"http://localhost:{new_port}"
            content = re.sub(pattern, replacement, content)
            
            with open(service_file, 'w') as f:
                f.write(content)
                
            print(f"✅ Updated {service_file} to use port {new_port}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to update {service_file}: {e}")
            return False
            
    def launch_service(self, service_key):
        """Launch a service with smart port management"""
        service = self.services[service_key]
        
        print(f"🚀 LAUNCHING {service['name']}")
        print(f"   📝 {service['description']}")
        print("-" * 70)
        
        # Get smart port assignment
        port = self.port_manager.get_port(service_key, force=True)
        if not port:
            print(f"❌ Could not get port for {service_key}")
            return False
            
        print(f"🔌 Assigned port: {port}")
        
        # Check if file exists
        if not os.path.exists(service['file']):
            print(f"❌ CRITICAL: {service['file']} not found!")
            return False
        print(f"✅ Service file ready: {service['file']}")
        
        # Update the service file with correct port
        if not self.update_service_port(service['file'], port):
            print(f"❌ Failed to update service port")
            return False
            
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
            if self.test_service(port):
                print(f"✅ SERVICE IS LIVE!")
                print(f"🌐 Access: http://localhost:{port}")
                print()
                return True
                
            print(f"   ⏳ Starting... ({i+1}/20)")
            time.sleep(1)
            
        print(f"❌ Service failed to start after 20 seconds")
        return False
        
    def get_status(self):
        """Get status of all services"""
        print("📊 UNFUCKABLE UNIVERSE STATUS")
        print("=" * 70)
        
        all_active = True
        active_services = []
        
        for service_key, service in self.services.items():
            port = self.port_manager.default_ports.get(service_key)
            if port and self.test_service(port):
                print(f"✅ {service['name']:30} | LIVE | http://localhost:{port}")
                active_services.append(f"http://localhost:{port}")
            else:
                print(f"❌ {service['name']:30} | DOWN | Expected port {port}")
                all_active = False
                
        print()
        return all_active, active_services
        
    def launch_unfuckable_universe(self):
        """Launch the complete unfuckable universe"""
        self.clear_screen()
        self.print_unfuckable_header()
        
        # Show port map
        self.port_manager.show_port_map()
        print()
        
        # Emergency cleanup first
        print("🧹 SMART CLEANUP...")
        self.port_manager.cleanup_all_ports()
        print()
        
        # Launch services in order
        success_count = 0
        for service_key in ['universe', 'automation', 'main', 'arena']:
            if self.launch_service(service_key):
                success_count += 1
            else:
                print(f"💀 {self.services[service_key]['name']} FAILED")
                print()
                
        # Final status
        print("🎯 UNFUCKABLE LAUNCH COMPLETE")
        print("=" * 70)
        
        all_active, active_services = self.get_status()
        
        if all_active:
            print("🌌 UNFUCKABLE UNIVERSE IS LIVE!")
            print("🔥 SMART PORT MANAGEMENT - NO MORE CONFLICTS!")
            print()
            print("🎮 ACCESS POINTS:")
            for i, url in enumerate(active_services, 1):
                service_name = list(self.services.values())[i-1]['name']
                print(f"   {i}. {service_name}")
                print(f"      {url}")
            print()
            print("🚀 IMMERSION FEATURES:")
            print("   ✅ Smart port management - no conflicts")
            print("   ✅ Automatic port fallbacks")
            print("   ✅ Animated starfield universe portal")
            print("   ✅ Portal matrix to all systems")
            print("   ✅ Live consciousness tracking")
            print("   ✅ High-stakes AI arena battles")
            print("   ✅ Complete system integration")
            print()
            print("💡 THE SYSTEM IS NOW UNFUCKABLE!")
            print("   Ports are managed intelligently")
            print("   No more manual port conflicts")
            print("   Automatic cleanup and fallbacks")
            
        else:
            print("⚠️  Some services failed to start")
            print("🔧 Check individual service logs")
            
        return all_active

def main():
    launcher = UnfuckableUniverseLauncher()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'status':
            launcher.clear_screen()
            launcher.print_unfuckable_header()
            launcher.get_status()
        elif command == 'ports':
            launcher.port_manager.show_port_map()
        elif command == 'cleanup':
            launcher.port_manager.cleanup_all_ports()
        else:
            launcher.launch_unfuckable_universe()
    else:
        launcher.launch_unfuckable_universe()

if __name__ == '__main__':
    main()