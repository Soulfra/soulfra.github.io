#!/usr/bin/env python3
"""
UNFUCKABLE PORT MANAGER - Fix this port bullshit forever
Smart port allocation, automatic fallbacks, no more conflicts
"""

import socket
import subprocess
import time
import json
from pathlib import Path

class UnfuckablePortManager:
    """Manages ports intelligently so we never have conflicts again"""
    
    def __init__(self):
        self.config_file = "soulfra_ports.json"
        self.reserved_ports = [
            22, 25, 53, 80, 110, 143, 443, 993, 995,  # System ports
            3000, 5000, 6000, 8000, 8080,  # Commonly used
            3306, 5432, 27017,  # Database ports
        ]
        
        # Default safe port assignments
        self.default_ports = {
            'universe': 8888,
            'automation': 9090,
            'main': 3333, 
            'arena': 4444,
            'immersion': 5555,
            'sites': 9999,
            'marketplace': 7777,
            'cal_riven': 4040,
            'sacred_docs': 8889,
            'reflection': 8890,
            'deployment': 8891
        }
        
        self.load_port_config()
        
    def load_port_config(self):
        """Load existing port configuration"""
        if Path(self.config_file).exists():
            try:
                with open(self.config_file, 'r') as f:
                    saved_config = json.load(f)
                    self.default_ports.update(saved_config)
                print(f"✅ Loaded port configuration from {self.config_file}")
            except:
                print(f"⚠️  Could not load {self.config_file}, using defaults")
        else:
            self.save_port_config()
            
    def save_port_config(self):
        """Save current port configuration"""
        with open(self.config_file, 'w') as f:
            json.dump(self.default_ports, f, indent=2)
        print(f"✅ Saved port configuration to {self.config_file}")
        
    def is_port_available(self, port):
        """Check if port is actually available"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                return result != 0  # 0 means connection successful (port in use)
        except:
            return True
            
    def find_available_port(self, preferred_port, service_name):
        """Find an available port, starting with preferred"""
        # Try preferred port first
        if self.is_port_available(preferred_port):
            print(f"✅ {service_name}: Using preferred port {preferred_port}")
            return preferred_port
            
        # Port is taken, find alternative
        print(f"⚠️  {service_name}: Port {preferred_port} in use, finding alternative...")
        
        # Try nearby ports
        for offset in range(1, 50):
            for direction in [1, -1]:
                candidate = preferred_port + (offset * direction)
                if candidate < 1024 or candidate > 65535:
                    continue
                if candidate in self.reserved_ports:
                    continue
                    
                if self.is_port_available(candidate):
                    print(f"✅ {service_name}: Found available port {candidate}")
                    self.default_ports[service_name] = candidate
                    self.save_port_config()
                    return candidate
                    
        # If we get here, something is seriously wrong
        print(f"❌ Could not find available port for {service_name}")
        return None
        
    def kill_port(self, port):
        """Kill any process using a port"""
        try:
            result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                  capture_output=True, text=True, timeout=5)
            if result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    subprocess.run(['kill', '-9', pid], timeout=5)
                print(f"🔥 Killed processes on port {port}: {pids}")
                time.sleep(2)
                return True
        except Exception as e:
            print(f"⚠️  Could not kill port {port}: {e}")
        return False
        
    def force_claim_port(self, port, service_name):
        """Force claim a port by killing existing processes"""
        print(f"🔥 Force claiming port {port} for {service_name}")
        
        if self.kill_port(port):
            if self.is_port_available(port):
                print(f"✅ Successfully claimed port {port}")
                return port
            else:
                print(f"❌ Port {port} still not available after kill")
        
        return self.find_available_port(port, service_name)
        
    def get_port(self, service_name, force=False):
        """Get a port for a service"""
        if service_name not in self.default_ports:
            print(f"❌ Unknown service: {service_name}")
            return None
            
        preferred_port = self.default_ports[service_name]
        
        if force:
            return self.force_claim_port(preferred_port, service_name)
        else:
            return self.find_available_port(preferred_port, service_name)
            
    def get_all_ports(self, force=False):
        """Get ports for all services"""
        ports = {}
        for service_name in self.default_ports:
            port = self.get_port(service_name, force)
            if port:
                ports[service_name] = port
        return ports
        
    def show_port_map(self):
        """Show current port assignments"""
        print("\n📊 SOULFRA PORT MAP")
        print("=" * 60)
        
        for service, port in self.default_ports.items():
            available = "✅ AVAILABLE" if self.is_port_available(port) else "❌ IN USE"
            print(f"{service:15} | Port {port:5} | {available}")
            
        print("=" * 60)
        
    def cleanup_all_ports(self):
        """Emergency cleanup - kill all Soulfra processes"""
        print("🧹 EMERGENCY PORT CLEANUP")
        print("=" * 40)
        
        killed_any = False
        for service, port in self.default_ports.items():
            if not self.is_port_available(port):
                print(f"🔥 Cleaning {service} on port {port}")
                if self.kill_port(port):
                    killed_any = True
                    
        if killed_any:
            print("✅ Cleanup complete - waiting for ports to free...")
            time.sleep(3)
        else:
            print("✅ No cleanup needed - all ports available")

def main():
    pm = UnfuckablePortManager()
    
    import sys
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'show' or command == 'map':
            pm.show_port_map()
        elif command == 'cleanup':
            pm.cleanup_all_ports()
        elif command == 'force':
            print("🔥 FORCE MODE - Claiming all ports")
            ports = pm.get_all_ports(force=True)
            print(f"✅ Claimed ports: {ports}")
        elif command.startswith('get:'):
            service = command.split(':')[1]
            port = pm.get_port(service)
            print(f"{service}: {port}")
        else:
            print("Unknown command")
            print("Usage:")
            print("  python3 UNFUCKABLE_PORT_MANAGER.py show")
            print("  python3 UNFUCKABLE_PORT_MANAGER.py cleanup") 
            print("  python3 UNFUCKABLE_PORT_MANAGER.py force")
            print("  python3 UNFUCKABLE_PORT_MANAGER.py get:universe")
    else:
        pm.show_port_map()

if __name__ == '__main__':
    main()