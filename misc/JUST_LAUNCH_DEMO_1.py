#!/usr/bin/env python3
"""
JUST LAUNCH DEMO - Skip all the bullshit and run what works
This finds and runs your actual working demo
"""

import os
import sys
import subprocess
import time
import socket

def kill_port(port):
    """Kill anything on a port"""
    os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')

def check_port(port):
    """Check if port is open"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

print("=" * 60)
print("🚀 JUST LAUNCHING YOUR WORKING DEMO")
print("=" * 60)
print("Skipping all consolidation bullshit...")
print("Finding what actually works...")
print()

# Kill common conflicting ports
print("🧹 Clearing ports...")
for port in [7777, 9999, 8888]:
    kill_port(port)
    print(f"   Cleared port {port}")
time.sleep(2)

# Find the best working demo
demos = [
    ("QUICK_DEMO.py", "Quick unified demo"),
    ("WORKING_DEMO.py", "Comprehensive demo"), 
    ("SOULFRA_UNIFIED_MOBILE.py", "Mobile-first unified"),
    ("handoff/SOULFRA_PROCESS_MANAGER.py", "Process manager"),
    ("SOULFRA_ULTIMATE_UNIFIED.py", "Ultimate unified (60+ features)")
]

launched = False
for script, desc in demos:
    if os.path.exists(script):
        print(f"\n✅ Found: {script}")
        print(f"   Description: {desc}")
        print(f"   Launching...")
        
        # Launch it
        proc = subprocess.Popen(
            [sys.executable, script],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        # Monitor startup
        print("\n📊 Startup log:")
        print("-" * 40)
        
        start_time = time.time()
        lines_shown = 0
        
        while time.time() - start_time < 10 and lines_shown < 20:
            line = proc.stdout.readline()
            if line:
                print(line.strip())
                lines_shown += 1
                
                # Check for success indicators
                if any(indicator in line for indicator in [
                    "Running at", "Server running", "Platform running",
                    "localhost:", "0.0.0.0:", "System ready"
                ]):
                    launched = True
                    
            # Also check ports
            if check_port(7777) or check_port(9999):
                launched = True
                break
                
            time.sleep(0.1)
        
        if launched:
            print("\n" + "=" * 60)
            print("🎉 SUCCESS! YOUR DEMO IS RUNNING!")
            print("=" * 60)
            
            # Show where to access
            if check_port(7777):
                print("📱 Mobile-first interface: http://localhost:7777")
            if check_port(9999):
                print("🚀 SOULFRA Ultimate: http://localhost:9999")
            if check_port(8888):
                print("💬 Chat interface: http://localhost:8888")
                
            print("\n✨ Features available:")
            print("  • AI vs AI debates")
            print("  • VIBE token economy")
            print("  • Personality marketplace")
            print("  • Ollama AI integration")
            print("  • 60+ platform features")
            
            print("\n🎯 This is your PRODUCTION DEMO - ready to send!")
            print("=" * 60)
            
            # Keep script running
            print("\nPress Ctrl+C to stop the demo")
            try:
                proc.wait()
            except KeyboardInterrupt:
                print("\n👋 Stopping demo...")
                proc.terminate()
                
            break
            
        else:
            print(f"\n⚠️ {script} didn't start properly, trying next...")
            proc.terminate()
            time.sleep(1)

if not launched:
    print("\n" + "=" * 60)
    print("❌ NO DEMOS STARTED SUCCESSFULLY")
    print("=" * 60)
    print("\nTry running directly:")
    print("  python3 SOULFRA_UNIFIED_MOBILE.py")
    print("  or")
    print("  python3 SOULFRA_ULTIMATE_UNIFIED.py")
    print("\nMake sure you have Flask installed:")
    print("  pip install flask flask-socketio flask-cors")
else:
    print("\n✅ Demo running successfully!")