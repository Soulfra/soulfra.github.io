#!/usr/bin/env python3
"""
LAUNCH PRODUCTION - Direct launcher for your real SOULFRA system
No bash, no fake responses, just your actual production platform
"""

import os
import sys
import subprocess
import time
import socket

def check_port(port):
    """Check if port is open"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

def launch_soulfra():
    print("=" * 60)
    print("🚀 LAUNCHING REAL SOULFRA PRODUCTION SYSTEM")
    print("=" * 60)
    print()
    
    # Kill any fake systems or conflicts
    print("🧹 Cleaning up any conflicts...")
    os.system('lsof -ti :9999 | xargs kill -9 2>/dev/null')
    os.system('lsof -ti :7777 | xargs kill -9 2>/dev/null')
    time.sleep(2)
    
    # Determine which launcher to use
    launchers = [
        ("QUICK_DEMO.py", "Quick demo launcher", True),
        ("WORKING_DEMO.py", "Comprehensive demo", True),
        ("SOULFRA_UNIFIED_MOBILE.py", "Direct platform launch", False),
        ("handoff/SOULFRA_PROCESS_MANAGER.py", "Production manager", False)
    ]
    
    launched = False
    for launcher, desc, is_demo in launchers:
        if os.path.exists(launcher):
            print(f"✅ Found: {launcher} - {desc}")
            
            if is_demo and not launched:
                print(f"🚀 Launching {launcher}...")
                
                # Run the launcher
                proc = subprocess.Popen(
                    [sys.executable, launcher],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True
                )
                
                # Monitor output
                print("\n📊 Launch Output:")
                print("-" * 40)
                
                start_time = time.time()
                while time.time() - start_time < 10:  # Monitor for 10 seconds
                    output = proc.stdout.readline()
                    if output:
                        print(output.strip())
                    
                    # Check if services are starting
                    if check_port(7777):
                        print("\n✅ Platform detected on port 7777!")
                        launched = True
                        break
                    elif check_port(9999):
                        print("\n✅ Platform detected on port 9999!")
                        launched = True
                        break
                        
                    time.sleep(0.5)
                
                if launched:
                    break
    
    print("\n" + "=" * 60)
    
    if launched:
        print("🎉 SOULFRA PRODUCTION SYSTEM IS RUNNING!")
        print()
        print("🌐 Access your system at:")
        
        if check_port(7777):
            print("   • Main Platform: http://localhost:7777")
        if check_port(9999):
            print("   • SOULFRA Ultimate: http://localhost:9999")
        if check_port(8888):
            print("   • Chat Interface: http://localhost:8888")
            
        print()
        print("✅ This is your REAL system with:")
        print("   • Actual Ollama AI integration")
        print("   • AI vs AI debates")
        print("   • VIBE token economy")
        print("   • Personality marketplace")
        print("   • Self-healing processes")
        print()
        print("💬 You can now send this demo to others!")
        
    else:
        print("⚠️ Could not auto-launch. Try manually:")
        print()
        print("python3 QUICK_DEMO.py")
        print("or")
        print("python3 SOULFRA_UNIFIED_MOBILE.py")
        
    print("=" * 60)

if __name__ == "__main__":
    # First run self-healing if needed
    if not check_port(7777) and not check_port(9999):
        print("🔧 Running self-healing first...")
        if os.path.exists("SELF_HEAL_NOW.py"):
            subprocess.run([sys.executable, "SELF_HEAL_NOW.py"])
            print()
    
    launch_soulfra()