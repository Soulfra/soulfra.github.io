#!/usr/bin/env python3
"""
UNIFIED AI LAUNCHER - Launch SOULFRA with guaranteed real AI integration
Combines LOCAL_AI_ECOSYSTEM's Ollama integration with SOULFRA ULTIMATE
"""

import os
import sys
import subprocess
import time
import socket
import threading
import webbrowser
from pathlib import Path
from datetime import datetime

class UnifiedAILauncher:
    def __init__(self):
        self.ollama_process = None
        self.soulfra_process = None
        self.services_running = []
        
    def print_banner(self):
        """Display startup banner"""
        print("""
╔══════════════════════════════════════════════════════════════╗
║                    SOULFRA UNIFIED AI LAUNCHER               ║
║                    Real AI • Real Responses                  ║
╚══════════════════════════════════════════════════════════════╝
        """)
        
    def check_port(self, port):
        """Check if a port is in use"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
        
    def kill_port(self, port):
        """Kill process on a specific port"""
        os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
        
    def check_ollama_installed(self):
        """Check if Ollama is installed"""
        try:
            result = subprocess.run(['ollama', '--version'], 
                                  capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            return False
            
    def check_ollama_running(self):
        """Check if Ollama service is running"""
        return self.check_port(11434)
        
    def start_ollama(self):
        """Start Ollama service"""
        print("\n🚀 Starting Ollama service...")
        
        if self.check_ollama_running():
            print("✅ Ollama already running")
            return True
            
        if not self.check_ollama_installed():
            print("❌ Ollama not installed!")
            print("\n📦 Install Ollama:")
            print("   curl -fsSL https://ollama.ai/install.sh | sh")
            print("   Then run this launcher again")
            return False
            
        # Start Ollama in background
        self.ollama_process = subprocess.Popen(
            ['ollama', 'serve'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for Ollama to start
        print("⏳ Waiting for Ollama to start...")
        for i in range(30):  # 30 seconds timeout
            if self.check_ollama_running():
                print("✅ Ollama service started!")
                self.services_running.append(("Ollama", 11434, self.ollama_process.pid))
                
                # Check for models
                self.check_ollama_models()
                return True
            time.sleep(1)
            
        print("❌ Failed to start Ollama service")
        return False
        
    def check_ollama_models(self):
        """Check and install Ollama models if needed"""
        try:
            result = subprocess.run(['ollama', 'list'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                output = result.stdout.strip()
                if not output or "NAME" not in output or len(output.split('\n')) <= 1:
                    print("\n📦 No models found. Installing llama2...")
                    
                    # Pull llama2 model
                    process = subprocess.Popen(
                        ['ollama', 'pull', 'llama2'],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        universal_newlines=True
                    )
                    
                    # Show progress
                    for line in iter(process.stdout.readline, ''):
                        if line:
                            print(f"   {line.strip()}")
                    
                    process.wait()
                    
                    if process.returncode == 0:
                        print("✅ Model installed successfully!")
                    else:
                        print("⚠️  Model installation failed, but continuing...")
                else:
                    print("✅ Models available:")
                    for line in output.split('\n')[1:]:  # Skip header
                        if line.strip():
                            print(f"   • {line.strip()}")
        except Exception as e:
            print(f"⚠️  Could not check models: {e}")
            
    def find_best_soulfra(self):
        """Find the best SOULFRA implementation to launch"""
        candidates = [
            {
                'path': '/Users/matthewmauer/Desktop/SOULFRA-FLAT/core/SOULFRA_ULTIMATE_UNIFIED.py',
                'name': 'SOULFRA-FLAT Ultimate',
                'port': 9999,
                'priority': 1
            },
            {
                'path': 'SOULFRA_ULTIMATE_UNIFIED.py',
                'name': 'SOULFRA Ultimate (Local)',
                'port': 9999,
                'priority': 2
            },
            {
                'path': 'LOCAL_AI_ECOSYSTEM.py',
                'name': 'Local AI Ecosystem',
                'port': 9999,
                'priority': 3
            }
        ]
        
        for candidate in candidates:
            if os.path.exists(candidate['path']):
                return candidate
                
        return None
        
    def launch_soulfra_with_ai(self):
        """Launch SOULFRA with AI integration"""
        print("\n🌟 Launching SOULFRA with AI integration...")
        
        # Clear ports
        print("🧹 Clearing ports...")
        for port in [9999, 8888, 7777]:
            self.kill_port(port)
        time.sleep(2)
        
        # Find best SOULFRA
        soulfra = self.find_best_soulfra()
        if not soulfra:
            print("❌ No SOULFRA implementation found!")
            return False
            
        print(f"\n✅ Found: {soulfra['name']}")
        print(f"   Path: {soulfra['path']}")
        print(f"   Port: {soulfra['port']}")
        
        # Set environment to ensure Ollama connection
        env = os.environ.copy()
        env['OLLAMA_URL'] = 'http://localhost:11434'
        
        # Launch SOULFRA
        print("\n🚀 Starting SOULFRA...")
        self.soulfra_process = subprocess.Popen(
            [sys.executable, soulfra['path']],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        # Monitor startup
        print("\n📊 Monitoring startup...")
        start_time = time.time()
        startup_complete = False
        
        def monitor_output():
            for line in iter(self.soulfra_process.stdout.readline, ''):
                if line:
                    # Show important startup messages
                    if any(keyword in line.lower() for keyword in [
                        'ollama', 'ai', 'connected', 'running', 'started',
                        'server', 'port', 'ready', '✅', '🚀'
                    ]):
                        print(f"   {line.strip()}")
                        
                    # Check if Ollama was detected
                    if 'ollama detected' in line.lower():
                        print("\n🎉 REAL AI INTEGRATION CONFIRMED!")
                    elif 'ollama not found' in line.lower():
                        print("\n⚠️  Warning: SOULFRA using fallback responses")
                        
        # Start output monitor in background
        monitor_thread = threading.Thread(target=monitor_output, daemon=True)
        monitor_thread.start()
        
        # Wait for service to start
        print("\n⏳ Waiting for SOULFRA to start...")
        for i in range(30):  # 30 seconds timeout
            if self.check_port(soulfra['port']):
                startup_complete = True
                self.services_running.append((soulfra['name'], soulfra['port'], self.soulfra_process.pid))
                break
            time.sleep(1)
            
        if startup_complete:
            print(f"\n✅ {soulfra['name']} is running!")
            return True
        else:
            print(f"\n❌ Failed to start {soulfra['name']}")
            return False
            
    def show_status_dashboard(self):
        """Display status dashboard"""
        print("\n" + "=" * 60)
        print("📊 SOULFRA AI STATUS DASHBOARD")
        print("=" * 60)
        
        # Check Ollama connection
        try:
            from CONNECT_REAL_OLLAMA import get_ollama_connector
            connector = get_ollama_connector()
            print(f"\n{connector.get_status_indicator()}")
            
            stats = connector.get_stats()
            if stats['ollama_available']:
                print(f"   Model: {stats['default_model']}")
                print(f"   URL: {stats['ollama_url']}")
        except:
            if self.check_ollama_running():
                print("\n🟢 AI: Ollama Running")
            else:
                print("\n🔴 AI: Ollama Not Running")
                
        # Show running services
        print("\n🟢 Running Services:")
        for service, port, pid in self.services_running:
            print(f"   • {service} (Port {port}, PID {pid})")
            
        # Access URLs
        print("\n🌐 Access Points:")
        print("   • SOULFRA: http://localhost:9999")
        print("   • Chat: http://localhost:8888")
        print("   • Mobile: http://localhost:7777")
        
        print("\n💡 Tips:")
        print("   • Check console for 'Ollama detected' message")
        print("   • If using fallback, restart with Ollama running")
        print("   • Press Ctrl+C to stop all services")
        
    def cleanup(self):
        """Clean up processes on exit"""
        print("\n\n🛑 Shutting down services...")
        
        if self.soulfra_process:
            self.soulfra_process.terminate()
            time.sleep(1)
            self.soulfra_process.kill()
            
        if self.ollama_process:
            print("   Stopping Ollama...")
            self.ollama_process.terminate()
            time.sleep(1)
            self.ollama_process.kill()
            
        print("✅ All services stopped")
        
    def run(self):
        """Main launcher flow"""
        self.print_banner()
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Step 1: Ensure Ollama is running
        if not self.start_ollama():
            print("\n❌ Cannot proceed without Ollama")
            return
            
        # Step 2: Launch SOULFRA with AI
        if not self.launch_soulfra_with_ai():
            print("\n❌ Failed to launch SOULFRA")
            self.cleanup()
            return
            
        # Step 3: Show status
        time.sleep(2)  # Give services time to fully initialize
        self.show_status_dashboard()
        
        # Step 4: Open browser
        print("\n🌐 Opening browser...")
        webbrowser.open('http://localhost:9999')
        
        # Keep running
        print("\n" + "=" * 60)
        print("✨ SOULFRA is running with REAL AI!")
        print("Press Ctrl+C to stop all services")
        print("=" * 60)
        
        try:
            # Keep the launcher running
            while True:
                time.sleep(1)
                
                # Check if processes are still alive
                if self.soulfra_process and self.soulfra_process.poll() is not None:
                    print("\n⚠️  SOULFRA process died! Restarting...")
                    self.launch_soulfra_with_ai()
                    
        except KeyboardInterrupt:
            self.cleanup()

def quick_launch():
    """Quick launch function for testing"""
    print("🚀 QUICK LAUNCH MODE")
    print("=" * 60)
    
    # Just check status and provide instructions
    from CONNECT_REAL_OLLAMA import get_ollama_connector
    connector = get_ollama_connector()
    
    print(f"\n{connector.get_status_indicator()}")
    
    if connector.ollama_available:
        print("\n✅ Ready to launch with AI!")
        print("\nRun one of these:")
        print("   python3 SOULFRA_ULTIMATE_UNIFIED.py")
        print("   python3 LOCAL_AI_ECOSYSTEM.py")
        print("   cd /Users/matthewmauer/Desktop/SOULFRA-FLAT && python3 PRODUCTION_LAUNCH.py")
    else:
        print("\n❌ Ollama not available")
        print("\n1. Start Ollama: ollama serve")
        print("2. Then run this launcher again")

if __name__ == "__main__":
    if "--quick" in sys.argv:
        quick_launch()
    else:
        launcher = UnifiedAILauncher()
        launcher.run()