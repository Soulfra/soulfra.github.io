#!/usr/bin/env python3
"""
SOULFRA MASTER PLATFORM STATUS
Shows everything we've built and how it connects
"""

import subprocess
import socket
import time

def check_port(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

print("""
╔════════════════════════════════════════════════════════════════════════╗
║                     SOULFRA PLATFORM ARCHITECTURE                       ║
╚════════════════════════════════════════════════════════════════════════╝

From Simple Game → Enterprise Platform → AI Intelligence Integration

""")

services = [
    {
        'name': 'Simple Click Game',
        'port': 13000,
        'url': 'http://localhost:13000',
        'desc': 'The original green square - where it all started',
        'tier': 'Foundation'
    },
    {
        'name': 'Habbo Hotel Style',
        'port': 13004,
        'url': 'http://localhost:13004',
        'desc': 'Isometric social world with chat',
        'tier': 'Game Layer'
    },
    {
        'name': 'RuneScape Adventure',
        'port': 13002,
        'url': 'http://localhost:13002',
        'desc': 'Classic RPG with minimap',
        'tier': 'Game Layer'
    },
    {
        'name': 'AI Battle Arena',
        'port': 13003,
        'url': 'http://localhost:13003',
        'desc': 'Automated betting system',
        'tier': 'Game Layer'
    },
    {
        'name': 'Enterprise Platform',
        'port': 16000,
        'url': 'http://localhost:16000',
        'desc': 'Multi-tenant licensing system with SDK',
        'tier': 'Enterprise'
    },
    {
        'name': 'Intelligence Engine',
        'port': 17000,
        'url': 'http://localhost:17000',
        'desc': 'Local AI with OCR, selection, browser monitoring',
        'tier': 'Intelligence'
    },
    {
        'name': 'Unified Intelligence Platform',
        'port': 18000,
        'url': 'http://localhost:18000',
        'desc': 'Games + AI = Next level gaming experience',
        'tier': 'Unified'
    }
]

print("SERVICE STATUS:")
print("="*75)

active_count = 0
for service in services:
    status = check_port(service['port'])
    status_text = "✓ ACTIVE" if status else "✗ INACTIVE"
    status_color = "\033[92m" if status else "\033[91m"
    reset_color = "\033[0m"
    
    if status:
        active_count += 1
    
    print(f"{status_color}{status_text}{reset_color} | Port {service['port']} | {service['name']}")
    print(f"         {service['desc']}")
    print(f"         URL: {service['url']}")
    print(f"         Tier: {service['tier']}")
    print("-"*75)

print(f"\n{active_count}/{len(services)} services active")

print("""
ARCHITECTURE OVERVIEW:
=====================

1. FOUNDATION LAYER (Simple Games)
   └─ Simple Click Game (13000) - The genesis
   └─ Habbo Style (13004) - Social gaming
   └─ RuneScape RPG (13002) - Adventure gaming  
   └─ AI Arena (13003) - Automated battles

2. ENTERPRISE LAYER (Platform & Licensing)
   └─ Enterprise Platform (16000)
       ├─ Multi-tenant architecture
       ├─ Licensing tiers ($99/$499/Custom)
       ├─ White-label capability
       ├─ Full SDK & API
       └─ Analytics dashboard

3. INTELLIGENCE LAYER (Local AI)
   └─ Intelligence Engine (17000)
       ├─ OCR screen capture
       ├─ Text selection monitoring
       ├─ Browser context awareness
       ├─ CJIS compliant filtering
       └─ 100% local processing

4. UNIFIED LAYER (Integration)
   └─ Unified Platform (18000)
       ├─ Games enhanced by AI
       ├─ Context-aware gameplay
       ├─ Privacy-first design
       └─ Real-time adaptation

KEY FEATURES:
============
• Started with: 50 lines of Python (green square game)
• Evolved to: Full enterprise SaaS platform
• Added: Local AI intelligence (like Cluely but privacy-focused)
• Result: Games that learn from you without compromising privacy

WHAT MAKES US DIFFERENT:
=======================
• Cluely: Streams everything to remote servers
• Soulfra: 100% local processing, CJIS compliant
• Integration: AI enhances games based on your context
• Privacy: Your data never leaves your device
• Enterprise: Full licensing and white-label ready

QUICK LINKS:
===========
Main Dashboard: http://localhost:18000
Enterprise: http://localhost:16000
Intelligence: http://localhost:17000
""")

if active_count < len(services):
    print("\nTo start missing services, run:")
    print("python3 LAUNCH_ENTERPRISE.py")
    print("\nOr individually:")
    for service in services:
        if not check_port(service['port']):
            print(f"python3 {service['name'].replace(' ', '_').upper()}.py")