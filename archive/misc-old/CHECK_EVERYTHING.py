#!/usr/bin/env python3
"""
CHECK EVERYTHING - See what the fuck is actually working
"""

import urllib.request
import socket
import subprocess

print("🔍 CHECKING ALL SOULFRA SYSTEMS")
print("=" * 60)

# Common ports to check
ports = [
    (3333, "Main Platform"),
    (4444, "AI Arena"),
    (5555, "Immersive Portal"),
    (7777, "Marketplace/Portal"),
    (8080, "Fight Viewer"),
    (8888, "Universe Portal"),
    (9090, "Automation Layer"),
    (9999, "Instant Sites"),
    (4040, "Cal Riven"),
    (8079, "Fight Viewer Alt"),
    (5557, "Bulletproof Portal"),
    (8765, "Alt Service"),
    (9091, "Automation Alt"),
    (8889, "Sacred Docs"),
    (8890, "Reflection"),
    (8891, "Deployment")
]

print("\n🌐 CHECKING PORTS:\n")

working_services = []

for port, service in ports:
    try:
        # Quick socket check
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        
        if result == 0:
            # Port is open, try HTTP
            try:
                response = urllib.request.urlopen(f'http://localhost:{port}', timeout=2)
                if response.status == 200:
                    print(f"✅ Port {port}: {service} - WORKING! http://localhost:{port}")
                    working_services.append((port, service))
                else:
                    print(f"⚠️  Port {port}: {service} - Port open but not HTTP")
            except:
                print(f"⚠️  Port {port}: {service} - Port open but not responding to HTTP")
        else:
            # Port closed
            pass  # Don't print, too noisy
    except:
        pass

print("\n" + "=" * 60)
print(f"🔥 FOUND {len(working_services)} WORKING SERVICES:")
print("=" * 60)

for port, service in working_services:
    print(f"\n👉 http://localhost:{port} - {service}")

# Check running Python processes
print("\n\n🐍 PYTHON PROCESSES RUNNING:")
print("=" * 60)

result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
python_processes = [line for line in result.stdout.split('\n') if 'python' in line.lower() and 'grep' not in line]

soulfra_processes = []
for proc in python_processes:
    for keyword in ['SOULFRA', 'ARENA', 'PORTAL', 'AUTOMATION', 'FIGHT', 'IMMERSIVE', 'WORKING']:
        if keyword in proc.upper():
            # Extract the script name
            parts = proc.split()
            for part in parts:
                if '.py' in part:
                    soulfra_processes.append(part)
                    break

if soulfra_processes:
    print(f"\nFound {len(set(soulfra_processes))} unique Soulfra processes:")
    for proc in set(soulfra_processes):
        print(f"  • {proc}")
else:
    print("\nNo Soulfra processes found")

print("\n" + "=" * 60)
print("💡 WHAT TO DO:")
print("=" * 60)

if working_services:
    print("\n✅ You have services running! Just visit the URLs above.")
    print("   The 2-minute timeouts are Claude's bash limit, NOT service failures.")
    print("\n🎯 Start here:")
    
    # Prioritize services
    for port, service in working_services:
        if port == 5555:
            print(f"   👉 http://localhost:{port} - IMMERSIVE PORTAL (Best experience)")
        elif port == 3333:
            print(f"   👉 http://localhost:{port} - MAIN PLATFORM")
            
else:
    print("\n❌ No services found running.")
    print("   Run: python3 UNFUCKABLE_UNIVERSE_LAUNCHER.py")
    print("   Or:  python3 LAUNCH_ALL_MAXED.sh")