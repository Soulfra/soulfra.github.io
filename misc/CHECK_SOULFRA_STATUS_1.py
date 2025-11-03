#!/usr/bin/env python3
"""
CHECK SOULFRA STATUS
Quick check of what's running
"""

import urllib.request
import subprocess

def check_service(url, name):
    """Check if a service is running"""
    try:
        response = urllib.request.urlopen(url, timeout=1)
        return True
    except:
        return False

print("🔍 SOULFRA STATUS CHECK")
print("=" * 60)

# Check known services
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
    if check_service(url, name):
        print(f"✅ {name}: {url}")
        running.append((url, name))
    else:
        print(f"❌ {name}: Not running")

print("\n" + "=" * 60)
print(f"📊 SUMMARY: {len(running)} services running")

if running:
    print("\n🚀 ACTIVE SERVICES:")
    for url, name in running:
        print(f"   {name}: {url}")
    
    print("\n💡 MAIN ACCESS POINT:")
    if any('9876' in url for url, _ in running):
        print("   http://localhost:9876 - SOULFRA NOW Platform")
        print("   - Drop files to create AI agents")
        print("   - Start with 28,000 VIBE ($2,800)")
        print("   - Agents earn VIBE automatically")

print("\n✨ To start the main platform:")
print("   python3 SOULFRA_NOW.py")
print("\n✨ To see all services:")
print("   python3 SOULFRA_CONTROL_PANEL.py")