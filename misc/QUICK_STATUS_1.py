#!/usr/bin/env python3
"""
QUICK STATUS - Check what's running right now
"""

import socket
import json
import time

def check_port(port):
    """Check if port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def main():
    services = {
        8888: "Chat Interface (ACTUALLY_WORKING.py)",
        9999: "SOULFRA Ultimate (main platform with 60+ features)",
        7777: "Monitor (system monitoring)", 
        9091: "AI Economy (GitHub automation)",
        4040: "Chat Logger",
        11434: "Ollama (AI backend)"
    }
    
    print("=" * 60)
    print("SOULFRA SYSTEM STATUS")
    print("=" * 60)
    
    running = 0
    total = len(services)
    
    for port, description in services.items():
        is_running = check_port(port)
        status = "✅ RUNNING" if is_running else "❌ STOPPED"
        print(f"Port {port}: {status} - {description}")
        if is_running:
            running += 1
    
    print(f"\\nStatus: {running}/{total} services running")
    
    if running == 0:
        print("\\n🔴 NO SERVICES RUNNING")
        print("To start everything: python3 START_EVERYTHING.py")
    elif running < total:
        print(f"\\n🟡 PARTIAL SYSTEM ({running}/{total})")
        if check_port(8888):
            print("✅ Chat interface available at: http://localhost:8888")
        if check_port(9999):
            print("✅ SOULFRA Ultimate available at: http://localhost:9999")
    else:
        print("\\n🟢 ALL SYSTEMS OPERATIONAL")
        print("✅ Chat with your system at: http://localhost:8888")
        print("✅ Full platform at: http://localhost:9999")
    
    # Specific recommendations
    print("\\n" + "=" * 60)
    if not check_port(9999):
        print("🎯 Priority: Start SOULFRA Ultimate")
        print("   Command: python3 SOULFRA_ULTIMATE_UNIFIED.py")
    elif not check_port(7777):
        print("🎯 Priority: Start Monitor")  
        print("   Command: python3 FIXED_MONITOR.py")
    elif check_port(8888) and check_port(9999):
        print("🎉 Core system ready! Chat at http://localhost:8888")
    
    print("\\nFor full startup: python3 START_EVERYTHING.py")

if __name__ == "__main__":
    main()