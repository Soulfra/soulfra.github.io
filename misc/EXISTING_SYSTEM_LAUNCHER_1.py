#!/usr/bin/env python3
"""
EXISTING SYSTEM LAUNCHER - Use what we already built!
Just connect to the systems that already exist and work
"""

import os
import json
import subprocess
import urllib.request
from datetime import datetime

class ExistingSystemConnector:
    """Connect to the systems we already built"""
    
    def __init__(self):
        self.systems = {
            'smart_analyzer': {'port': 6969, 'file': 'SMART_CODEBASE_ANALYZER.py'},
            'automated_assistant': {'port': 8080, 'file': 'AUTOMATED_CODE_ASSISTANT.py'},
            'ai_economy': {'port': 9090, 'file': 'AI_ECONOMY_GITHUB_AUTOMATION.py'},
            'addiction_engine': {'port': 7777, 'file': 'ADDICTION_ENGINE.py'},
            'empathy_engine': {'port': 5555, 'file': 'SYNTHETIC_EMPATHY_ENGINE.py'}
        }
    
    def check_system_running(self, system_name):
        """Check if a system is already running"""
        if system_name not in self.systems:
            return False
        
        port = self.systems[system_name]['port']
        try:
            response = urllib.request.urlopen(f'http://localhost:{port}/health', timeout=2)
            return response.status == 200
        except:
            # Try just checking if port is open
            import socket
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                sock.close()
                return result == 0
            except:
                return False
    
    def get_system_status(self):
        """Get status of all existing systems"""
        status = {}
        for system_name, config in self.systems.items():
            status[system_name] = {
                'running': self.check_system_running(system_name),
                'port': config['port'],
                'file': config['file'],
                'exists': os.path.exists(config['file'])
            }
        return status
    
    def interact_with_analyzer(self, query):
        """Send query to Smart Codebase Analyzer"""
        if not self.check_system_running('smart_analyzer'):
            return {'error': 'Smart Analyzer not running on port 6969'}
        
        try:
            data = json.dumps({'query': query}).encode()
            req = urllib.request.Request(
                'http://localhost:6969/analyze',
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            response = urllib.request.urlopen(req, timeout=10)
            return json.loads(response.read().decode())
        except Exception as e:
            return {'error': f'Failed to connect to analyzer: {e}'}
    
    def send_to_assistant(self, task):
        """Send task to Automated Assistant"""
        if not self.check_system_running('automated_assistant'):
            return {'error': 'Automated Assistant not running on port 8080'}
        
        try:
            data = json.dumps({'task': task}).encode()
            req = urllib.request.Request(
                'http://localhost:8080/assist',
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            response = urllib.request.urlopen(req, timeout=15)
            return json.loads(response.read().decode())
        except Exception as e:
            return {'error': f'Failed to connect to assistant: {e}'}
    
    def create_github_task(self, improvement):
        """Send improvement to AI Economy for GitHub PR"""
        if not self.check_system_running('ai_economy'):
            return {'error': 'AI Economy not running on port 9090'}
        
        try:
            data = json.dumps({'improvement': improvement}).encode()
            req = urllib.request.Request(
                'http://localhost:9090/create_pr',
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            response = urllib.request.urlopen(req, timeout=20)
            return json.loads(response.read().decode())
        except Exception as e:
            return {'error': f'Failed to connect to AI Economy: {e}'}

def main():
    """Main function to interact with existing systems"""
    
    connector = ExistingSystemConnector()
    
    print("""
🚀 EXISTING SYSTEM LAUNCHER

This connects to the systems we already built!
No need to rebuild - just use what works.
""")
    
    # Check what's running
    status = connector.get_system_status()
    
    print("📊 SYSTEM STATUS:")
    running_count = 0
    for system_name, info in status.items():
        status_icon = "✅" if info['running'] else "❌"
        exists_icon = "📄" if info['exists'] else "❓"
        print(f"   {status_icon} {system_name}: port {info['port']} {exists_icon}")
        if info['running']:
            running_count += 1
    
    print(f"\n🎯 {running_count}/{len(status)} systems are running")
    
    if running_count == 0:
        print("""
💡 TO START SYSTEMS:
1. Open separate terminals
2. Run: python3 SMART_CODEBASE_ANALYZER.py
3. Run: python3 AUTOMATED_CODE_ASSISTANT.py  
4. Run: python3 AI_ECONOMY_GITHUB_AUTOMATION.py
5. Then come back here to use them!
""")
        return
    
    # Interactive mode
    print(f"""
🎯 INTERACTIVE MODE - {running_count} systems available

Commands:
- analyze [query] - Ask Smart Analyzer about your code
- improve [task] - Send task to Automated Assistant
- github [improvement] - Create GitHub PR via AI Economy
- status - Check system status
- quit - Exit
""")
    
    while True:
        try:
            command = input("\n> ").strip()
            
            if command == 'quit':
                break
            elif command == 'status':
                status = connector.get_system_status()
                for name, info in status.items():
                    status_text = "RUNNING" if info['running'] else "STOPPED"
                    print(f"   {name}: {status_text} (port {info['port']})")
            
            elif command.startswith('analyze '):
                query = command[8:]
                print("🔍 Sending to Smart Analyzer...")
                result = connector.interact_with_analyzer(query)
                print(f"📊 Result: {json.dumps(result, indent=2)}")
            
            elif command.startswith('improve '):
                task = command[8:]
                print("🛠️ Sending to Automated Assistant...")
                result = connector.send_to_assistant(task)
                print(f"💡 Result: {json.dumps(result, indent=2)}")
            
            elif command.startswith('github '):
                improvement = command[7:]
                print("🚀 Creating GitHub task...")
                result = connector.create_github_task(improvement)
                print(f"📝 Result: {json.dumps(result, indent=2)}")
            
            elif command == 'help':
                print("""
Available commands:
- analyze [query] - Ask Smart Analyzer about your codebase
- improve [task] - Send improvement task to Assistant  
- github [improvement] - Create GitHub PR for improvement
- status - Check which systems are running
- quit - Exit interactive mode
""")
            
            else:
                print("❓ Unknown command. Type 'help' for available commands.")
                
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n✅ Existing System Launcher stopped")

if __name__ == '__main__':
    main()