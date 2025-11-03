#!/usr/bin/env python3
"""
START ALL SERVICES - Launch everything in the correct order
"""

import os
import time
import subprocess
import signal
import sys

class ServiceLauncher:
    """Manage all services"""
    
    def __init__(self):
        self.services = [
            {
                'name': 'Chat Log Processor',
                'file': 'CHAT_LOG_PROCESSOR.py',
                'port': 4040,
                'desc': 'Process chat logs into documentation'
            },
            {
                'name': 'Simple Game',
                'file': 'simple_game_5555.py',
                'port': 5555,
                'desc': 'Simple clicker game'
            },
            {
                'name': 'Working Platform',
                'file': 'WORKING_PLATFORM.py',
                'port': 3002,
                'desc': 'Combined game and API router'
            },
            {
                'name': 'Visual Dashboard',
                'file': 'VISUAL_DASHBOARD.py',
                'port': 7777,
                'desc': 'System monitoring dashboard'
            }
        ]
        self.processes = []
    
    def kill_port(self, port):
        """Kill any process on a port"""
        try:
            os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
            time.sleep(0.5)
        except:
            pass
    
    def start_service(self, service):
        """Start a single service"""
        print(f"[STARTING] {service['name']} on port {service['port']}...")
        
        # Kill anything on the port first
        self.kill_port(service['port'])
        
        # Start the service
        try:
            process = subprocess.Popen(
                [sys.executable, service['file']],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid
            )
            self.processes.append(process)
            
            # Give it time to start
            time.sleep(2)
            
            # Check if it's running
            if process.poll() is None:
                print(f"[SUCCESS] {service['name']} running on port {service['port']}")
                return True
            else:
                print(f"[FAILED] {service['name']} failed to start")
                return False
                
        except Exception as e:
            print(f"[ERROR] Failed to start {service['name']}: {e}")
            return False
    
    def start_all(self):
        """Start all services"""
        print("""
=====================================
    SOULFRA SERVICE LAUNCHER
=====================================
""")
        
        # Start each service
        for service in self.services:
            self.start_service(service)
            print("-" * 40)
        
        print(f"""
=====================================
    ALL SERVICES LAUNCHED!
=====================================

[SERVICES RUNNING]
- Chat Log Processor: http://localhost:4040
- Simple Game: http://localhost:5555
- Working Platform: http://localhost:3002
- Visual Dashboard: http://localhost:7777

Press Ctrl+C to stop all services
""")
    
    def stop_all(self):
        """Stop all services"""
        print("\n[STOPPING] Shutting down all services...")
        
        # Kill all processes
        for process in self.processes:
            try:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            except:
                pass
        
        # Kill by port as backup
        for service in self.services:
            self.kill_port(service['port'])
        
        print("[STOPPED] All services stopped")
    
    def run(self):
        """Main run loop"""
        try:
            self.start_all()
            
            # Keep running until interrupted
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            self.stop_all()
            sys.exit(0)

if __name__ == '__main__':
    launcher = ServiceLauncher()
    launcher.run()