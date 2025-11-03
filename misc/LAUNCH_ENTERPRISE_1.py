#!/usr/bin/env python3
"""
SOULFRA ENTERPRISE LAUNCHER
Launch the complete enterprise stack
"""

import subprocess
import time
import os
import signal
import sys

processes = []

def signal_handler(sig, frame):
    print("\n\nShutting down all services...")
    for proc in processes:
        try:
            proc.terminate()
        except:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

print("""
╔═══════════════════════════════════════════════════════════════╗
║               SOULFRA ENTERPRISE PLATFORM                      ║
║                                                                ║
║  Taking simple games to enterprise-grade platform              ║
╚═══════════════════════════════════════════════════════════════╝
""")

services = [
    {
        'name': 'Simple Game',
        'file': 'FINAL_SIMPLE.py',
        'port': 13000,
        'desc': 'The original - where it all started'
    },
    {
        'name': 'Habbo Hotel',
        'file': 'HABBO_POLISHED.py',
        'port': 13004,
        'desc': 'Isometric social world'
    },
    {
        'name': 'RuneScape',
        'file': 'RUNESCAPE_SIMPLE.py',
        'port': 13002,
        'desc': 'Classic RPG adventure'
    },
    {
        'name': 'AI Arena',
        'file': 'AI_ARENA_SIMPLE.py',
        'port': 13003,
        'desc': 'Automated battle betting'
    },
    {
        'name': 'Enterprise Platform',
        'file': 'ENTERPRISE_PLATFORM_MAX.py',
        'port': 16000,
        'desc': 'Multi-tenant licensing platform'
    }
]

print("Starting services...\n")

for service in services:
    if os.path.exists(service['file']):
        print(f"[+] Starting {service['name']} on port {service['port']}...")
        proc = subprocess.Popen(
            ['python3', service['file']],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        processes.append(proc)
        time.sleep(1)
        print(f"    {service['desc']}")
        print(f"    URL: http://localhost:{service['port']}")
    else:
        print(f"[-] {service['file']} not found")

print("\n" + "="*65)
print("ENTERPRISE PLATFORM READY!")
print("="*65)
print("\nMain Enterprise Dashboard: http://localhost:16000")
print("\nFeatures:")
print("- Multi-tenant game hosting")
print("- Licensing tiers (Starter/Pro/Enterprise)")
print("- White-label customization")
print("- Full SDK & API access")
print("- Real-time analytics")
print("- Monetization built-in")
print("\nFrom simple green square to enterprise platform!")
print("\nPress Ctrl+C to stop all services")

# Keep running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    pass