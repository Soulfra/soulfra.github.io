#!/usr/bin/env python3
"""
CONTROL PANEL - Safe management interface for the MAXED OUT system
"""

import os
import json
import subprocess
import time
from datetime import datetime

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def show_menu():
    clear_screen()
    print("🎮 MAXED OUT CONTROL PANEL 🎮")
    print("=" * 60)
    print()
    print("1. 🏥 Run Health Check")
    print("2. 🧪 Test a Component (Safe Mode)")
    print("3. 🤖 Run an AI Agent")
    print("4. 📊 View System Stats")
    print("5. 🌐 Open Dashboard")
    print("6. 👁️  Start Live Watcher")
    print("7. 🔍 View Recent Activity")
    print("8. 🛑 Stop All Processes")
    print("9. 📝 View Safety Tips")
    print("0. 🚪 Exit")
    print()
    print("=" * 60)

def run_health_check():
    print("\n🏥 Running health check...")
    subprocess.run(['python3', 'SAFE_HEALTH_CHECK.py'])
    input("\nPress Enter to continue...")

def test_component():
    print("\n🧪 Available components:")
    
    comp_dir = 'maxed_out/components'
    if not os.path.exists(comp_dir):
        print("❌ Components directory not found!")
        input("\nPress Enter to continue...")
        return
        
    components = [f for f in os.listdir(comp_dir) if f.endswith('.py')]
    
    for i, comp in enumerate(components, 1):
        print(f"  {i}. {comp}")
        
    print("\nEnter component number (or 0 to cancel):")
    
    try:
        choice = int(input("> "))
        if 0 < choice <= len(components):
            comp_path = os.path.join(comp_dir, components[choice-1])
            print(f"\n🧪 Testing {components[choice-1]} in safe mode...")
            print("-" * 40)
            
            # Run with safe runner
            subprocess.run(['python3', 'safe_runner.py', comp_path])
        else:
            print("Cancelled")
            
    except:
        print("Invalid choice")
        
    input("\nPress Enter to continue...")

def run_ai_agent():
    print("\n🤖 Available AI Agents:")
    
    agent_dir = 'maxed_out/ai_agents'
    if not os.path.exists(agent_dir):
        print("❌ Agents directory not found!")
        input("\nPress Enter to continue...")
        return
        
    agents = [f for f in os.listdir(agent_dir) if f.endswith('.py')]
    
    for i, agent in enumerate(agents, 1):
        print(f"  {i}. {agent}")
        
    print("\nEnter agent number (or 0 to cancel):")
    
    try:
        choice = int(input("> "))
        if 0 < choice <= len(agents):
            agent_path = os.path.join(agent_dir, agents[choice-1])
            print(f"\n🤖 Running {agents[choice-1]}...")
            print("-" * 40)
            
            subprocess.run(['python3', agent_path])
        else:
            print("Cancelled")
            
    except:
        print("Invalid choice")
        
    input("\nPress Enter to continue...")

def view_stats():
    print("\n📊 System Statistics")
    print("=" * 40)
    
    try:
        # Load database stats
        import sqlite3
        db = sqlite3.connect('maxed_out/soulfra.db')
        cursor = db.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM components")
        comp_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM whispers")
        whisper_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM agents")
        agent_count = cursor.fetchone()[0]
        
        print(f"📦 Components: {comp_count}")
        print(f"🌬️  Whispers: {whisper_count}")
        print(f"🤖 Agents: {agent_count}")
        
        # Show recent whispers
        cursor.execute("""
            SELECT text, status, timestamp 
            FROM whispers 
            ORDER BY id DESC 
            LIMIT 5
        """)
        
        recent = cursor.fetchall()
        if recent:
            print("\n🌬️  Recent Whispers:")
            for text, status, ts in recent:
                print(f"  • {text[:50]}... [{status}]")
                
        db.close()
        
    except Exception as e:
        print(f"❌ Error loading stats: {e}")
        
    # Check system status
    if os.path.exists('system_status.json'):
        with open('system_status.json', 'r') as f:
            status = json.load(f)
            
        print(f"\n🏥 Health Score: {status['score']:.0f}%")
        print(f"✅ Status: {'HEALTHY' if status['healthy'] else 'NEEDS ATTENTION'}")
        print(f"🕐 Last Check: {status['checked_at']}")
        
    input("\nPress Enter to continue...")

def open_dashboard():
    dashboard_path = os.path.abspath('maxed_out/dashboards/MAXED_OUT_DASHBOARD.html')
    if os.path.exists(dashboard_path):
        print(f"\n🌐 Opening dashboard...")
        subprocess.run(['open', dashboard_path])
        print("✅ Dashboard opened in browser")
    else:
        print("❌ Dashboard not found! Run MAXED_THE_FUCK_OUT.py first")
        
    input("\nPress Enter to continue...")

def start_watcher():
    print("\n👁️  Starting Live Watcher...")
    print("This will run continuously. Press Ctrl+C to stop.")
    print("-" * 40)
    
    try:
        subprocess.run(['python3', 'LIVE_HANDOFF_WATCHER.py'])
    except KeyboardInterrupt:
        print("\n✅ Watcher stopped")
        
    input("\nPress Enter to continue...")

def view_activity():
    print("\n🔍 Recent Activity")
    print("=" * 40)
    
    # Check for recent files
    watch_dirs = ['inbox', 'handoffs', 'chatlogs', 'whispers']
    
    for dir_name in watch_dirs:
        if os.path.exists(dir_name):
            files = os.listdir(dir_name)
            if files:
                print(f"\n📁 {dir_name}/")
                for f in files[:5]:  # Show max 5 files
                    file_path = os.path.join(dir_name, f)
                    mtime = os.path.getmtime(file_path)
                    time_str = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M")
                    print(f"  • {f} ({time_str})")
                    
    # Show component creation times
    comp_dir = 'maxed_out/components'
    if os.path.exists(comp_dir):
        print(f"\n🔨 Recent Components:")
        comps = [(f, os.path.getmtime(os.path.join(comp_dir, f))) 
                 for f in os.listdir(comp_dir) if f.endswith('.py')]
        comps.sort(key=lambda x: x[1], reverse=True)
        
        for comp, mtime in comps[:5]:
            time_str = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M")
            print(f"  • {comp} ({time_str})")
            
    input("\nPress Enter to continue...")

def stop_processes():
    print("\n🛑 Stopping Python processes...")
    print("This will kill all Python processes. Continue? (y/n)")
    
    if input("> ").lower() == 'y':
        try:
            # Kill Python processes (except current one)
            subprocess.run(['pkill', '-f', 'python.*LIVE_HANDOFF_WATCHER'])
            subprocess.run(['pkill', '-f', 'python.*lightweight_monitor'])
            print("✅ Processes stopped")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("Cancelled")
        
    input("\nPress Enter to continue...")

def show_safety_tips():
    print("\n📝 Safety Tips")
    print("=" * 40)
    print()
    print("1. 🧪 Always test new components with safe_runner.py")
    print("2. 🏥 Run health check before heavy usage")
    print("3. 💾 Keep backups of important data")
    print("4. 🔍 Monitor system resources while running")
    print("5. 🛑 Use Control Panel to stop runaway processes")
    print("6. 📁 Only drop trusted files into watch directories")
    print("7. ⏱️  Components have 5-second timeout by default")
    print("8. 🤖 Run one AI agent at a time initially")
    print("9. 📊 Check dashboard for system overview")
    print("10. 🚨 If something goes wrong, run health check")
    print()
    print("💡 Pro tip: The system is designed to be safe,")
    print("   but always monitor first few runs!")
    
    input("\nPress Enter to continue...")

# Main loop
def main():
    while True:
        show_menu()
        
        choice = input("Enter choice: ")
        
        if choice == '1':
            run_health_check()
        elif choice == '2':
            test_component()
        elif choice == '3':
            run_ai_agent()
        elif choice == '4':
            view_stats()
        elif choice == '5':
            open_dashboard()
        elif choice == '6':
            start_watcher()
        elif choice == '7':
            view_activity()
        elif choice == '8':
            stop_processes()
        elif choice == '9':
            show_safety_tips()
        elif choice == '0':
            print("\n👋 Goodbye!")
            break
        else:
            print("Invalid choice!")
            time.sleep(1)

if __name__ == "__main__":
    # Check if system exists
    if not os.path.exists('maxed_out'):
        print("❌ MAXED OUT system not found!")
        print("   Run: python3 MAXED_THE_FUCK_OUT.py")
        print("   Then run this control panel again.")
    else:
        main()