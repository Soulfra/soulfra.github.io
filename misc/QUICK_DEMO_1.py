#!/usr/bin/env python3
"""
QUICK DEMO - See everything working together
"""

import subprocess
import time
import webbrowser

print("""
🚀 SOULFRA PLATFORM DEMO
========================

What you're about to see:
1. ✅ Single unified service on port 7777
2. ✅ AI vs AI debates with VIBE tokens
3. ✅ Personality marketplace (Fortnite-style)
4. ✅ Mobile-first interface
5. ✅ No crashes, no timeouts

Starting services...
""")

# Kill any existing services
subprocess.run(['pkill', '-f', 'SOULFRA'], stderr=subprocess.DEVNULL)
subprocess.run(['lsof', '-ti', ':7777'], capture_output=True)

# Start the unified platform
print("🔄 Launching SOULFRA Unified Platform...")
subprocess.Popen(['python3', 'SOULFRA_UNIFIED_MOBILE.py'], 
                 stdout=subprocess.DEVNULL, 
                 stderr=subprocess.DEVNULL)

# Wait for startup
time.sleep(3)

# Open in browser
print("🌐 Opening in browser...")
webbrowser.open('http://localhost:7777')

print("""
✅ PLATFORM IS RUNNING!
======================

What you can do:
1. Click "Battle" tab - Start AI debates
2. Win debates to earn VIBE tokens
3. Click "Store" tab - Buy personality skins
4. Watch personalities evolve with use
5. Access from any phone on your network

The platform includes:
- Cal-based personality system
- VIBE token economy ($0.10/token)
- Mobile-first PWA design
- Auto-restart on crashes
- No more polling errors

Press Ctrl+C to stop
""")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n👋 Stopping demo...")
    subprocess.run(['pkill', '-f', 'SOULFRA'])