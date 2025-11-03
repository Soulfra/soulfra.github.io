#!/usr/bin/env python3
"""
SOULFRA CONTROL PANEL
Shows what's running and provides easy access
"""

import subprocess
import os
import urllib.request
import json
from datetime import datetime

def check_service(url, name):
    """Check if a service is running"""
    try:
        response = urllib.request.urlopen(url, timeout=1)
        return True, f"✅ {name} is RUNNING at {url}"
    except:
        return False, f"❌ {name} is NOT running"

def find_running_services():
    """Find all running Soulfra services"""
    print("🔍 SCANNING FOR SOULFRA SERVICES...")
    print("=" * 60)
    
    # Check known ports
    services = [
        ("http://localhost:9876", "SOULFRA NOW (Main Platform)"),
        ("http://localhost:8888", "Web Interface"),
        ("http://localhost:8080", "Agent Hub"),
        ("http://localhost:8081", "API Server"),
        ("http://localhost:8889", "Integrated Hub"),
        ("http://localhost:8890", "AI Social Network"),
        ("http://localhost:8891", "OAuth Dashboard"),
        ("http://localhost:8892", "Rec Leagues"),
        ("http://localhost:3000", "3D Plaza"),
        ("http://localhost:3001", "Battle Arena"),
        ("http://localhost:3002", "AI Coliseum"),
    ]
    
    running = []
    for url, name in services:
        is_running, msg = check_service(url, name)
        print(msg)
        if is_running:
            running.append((url, name))
            
    return running

def show_control_panel(running_services):
    """Display control panel"""
    print("\n" + "=" * 60)
    print("🎮 SOULFRA CONTROL PANEL")
    print("=" * 60)
    
    if running_services:
        print(f"\n✅ {len(running_services)} SERVICES RUNNING:\n")
        for i, (url, name) in enumerate(running_services, 1):
            print(f"  [{i}] {name}")
            print(f"      {url}")
            print()
    else:
        print("\n❌ NO SERVICES RUNNING")
        
    print("\n📋 QUICK ACTIONS:")
    print("  [S] Start SOULFRA NOW (Main Platform)")
    print("  [M] Start MEGA INTEGRATION (All Services)")
    print("  [U] Start ULTIMATE LAUNCHER (Token Economy)")
    print("  [K] Kill all Soulfra services")
    print("  [R] Refresh status")
    print("  [Q] Quit")
    
def start_service(script):
    """Start a service"""
    if os.path.exists(script):
        print(f"\n🚀 Starting {script}...")
        process = subprocess.Popen(
            ["/usr/bin/python3", script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"✅ Started with PID {process.pid}")
        return process
    else:
        print(f"❌ {script} not found")
        return None

def kill_all_services():
    """Kill all Soulfra Python services"""
    print("\n🛑 Stopping all Soulfra services...")
    
    # Find Python processes with Soulfra in the command
    try:
        result = subprocess.run(
            ["ps", "aux"], 
            capture_output=True, 
            text=True
        )
        
        for line in result.stdout.split('\n'):
            if 'python' in line.lower() and ('soulfra' in line.lower() or 'SOULFRA' in line):
                parts = line.split()
                if len(parts) > 1:
                    pid = parts[1]
                    try:
                        subprocess.run(["kill", pid])
                        print(f"  ✅ Killed PID {pid}")
                    except:
                        pass
                        
    except Exception as e:
        print(f"  ❌ Error: {e}")

def main():
    """Main control loop"""
    while True:
        os.system('clear' if os.name == 'posix' else 'cls')
        
        running = find_running_services()
        show_control_panel(running)
        
        choice = input("\n🎮 Enter choice: ").upper()
        
        if choice == 'Q':
            break
        elif choice == 'R':
            continue
        elif choice == 'S':
            # Check if SOULFRA_NOW.py already running
            already_running = any('9876' in url for url, _ in running)
            if already_running:
                print("\n⚠️  SOULFRA NOW is already running!")
                input("Press Enter to continue...")
            else:
                start_service("SOULFRA_NOW.py")
                input("\nPress Enter to continue...")
        elif choice == 'M':
            start_service("SOULFRA_MEGA_INTEGRATION.py")
            input("\nPress Enter to continue...")
        elif choice == 'U':
            start_service("SOULFRA_ULTIMATE_LAUNCHER.py")
            input("\nPress Enter to continue...")
        elif choice == 'K':
            kill_all_services()
            input("\nPress Enter to continue...")
        elif choice.isdigit():
            # Open service in browser
            idx = int(choice) - 1
            if 0 <= idx < len(running):
                url, name = running[idx]
                print(f"\n🌐 Opening {name}...")
                subprocess.run(["open", url])
                input("\nPress Enter to continue...")

if __name__ == "__main__":
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ███████╗ ██████╗ ██╗   ██╗██╗     ███████╗██████╗   ║
║     ██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗  ║
║     ███████╗██║   ██║██║   ██║██║     █████╗  ██████╔╝  ║
║     ╚════██║██║   ██║██║   ██║██║     ██╔══╝  ██╔══██╗  ║
║     ███████║╚██████╔╝╚██████╔╝███████╗██║     ██║  ██║  ║
║     ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝  ║
║                                                           ║
║                    CONTROL PANEL                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    input("Press Enter to start...")
    main()