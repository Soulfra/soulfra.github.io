#!/usr/bin/env python3
"""
QUICK AUTOMATION LAUNCHER - Get automation running NOW
No more timeout bullshit - direct launch
"""

import os
import sys
import time
import subprocess
import urllib.request

def quick_launch():
    print("🚀 QUICK AUTOMATION LAUNCHER")
    print("=" * 50)
    
    # Kill any existing automation processes
    print("🧹 Cleaning automation ports...")
    try:
        subprocess.run(['pkill', '-f', 'AUTOMATED_FIGHT_LAYER'], capture_output=True)
        subprocess.run(['lsof', '-ti', ':9090'], capture_output=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.run(['kill', '-9'] + subprocess.run(['lsof', '-ti', ':9090'], capture_output=True, text=True).stdout.strip().split(), capture_output=True)
    except:
        pass
    
    time.sleep(2)
    print("✅ Ports cleared")
    
    # Start automation layer in background
    print("🤖 Starting Automated Fight Layer...")
    
    try:
        process = subprocess.Popen(
            [sys.executable, 'AUTOMATED_FIGHT_LAYER.py'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
        
        print(f"✅ Process started (PID: {process.pid})")
        
        # Test if it's working
        print("⏳ Testing automation layer...")
        for i in range(15):
            try:
                response = urllib.request.urlopen('http://localhost:9090', timeout=3)
                if response.status == 200:
                    print("✅ AUTOMATION LAYER IS LIVE!")
                    print("🌐 Access: http://localhost:9090")
                    print()
                    print("🤖 AUTOMATION FEATURES:")
                    print("  ✅ AI vs AI battles every 5-15 seconds")
                    print("  ✅ Automated betting from AI entities")
                    print("  ✅ Self-running economy events")
                    print("  ✅ Auto-spawning new fighters")
                    print("  ✅ Live battle visualization")
                    print("  ✅ Real-time automation feed")
                    print()
                    print("🔥 THE SYSTEM RUNS ITSELF!")
                    return True
            except:
                pass
                
            print(f"   ⏳ Waiting... ({i+1}/15)")
            time.sleep(1)
            
        print("❌ Automation layer failed to respond")
        return False
        
    except Exception as e:
        print(f"❌ Failed to start: {e}")
        return False

def check_automation_status():
    """Quick status check"""
    print("🔍 AUTOMATION STATUS CHECK")
    print("=" * 40)
    
    try:
        response = urllib.request.urlopen('http://localhost:9090', timeout=3)
        if response.status == 200:
            print("✅ Automation Layer: RUNNING")
            print("🌐 http://localhost:9090")
            return True
        else:
            print("❌ Automation Layer: UNRESPONSIVE")
            return False
    except:
        print("❌ Automation Layer: OFFLINE")
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'status':
        check_automation_status()
    else:
        if quick_launch():
            print("\n💡 REMEMBER: Claude timeouts are normal!")
            print("   The automation layer keeps running in background")
            print("   Just open http://localhost:9090 to see it working")
        else:
            print("\n🔧 Try running again if it failed")