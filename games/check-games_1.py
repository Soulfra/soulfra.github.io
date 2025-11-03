#!/usr/bin/env python3
"""Quick check to see what's actually working"""

import subprocess
import time

ports = [5555, 6666, 6969, 7777]

print("CHECKING GAMES...")
print("=" * 40)

for port in ports:
    try:
        result = subprocess.run(
            ['curl', '-s', '-m', '2', f'http://localhost:{port}', '-o', '/dev/null', '-w', '%{http_code}'],
            capture_output=True,
            text=True
        )
        
        if result.stdout.strip() == '200':
            print(f"✅ Port {port}: WORKING - http://localhost:{port}")
        else:
            print(f"❌ Port {port}: NOT WORKING (HTTP {result.stdout.strip()})")
    except:
        print(f"❌ Port {port}: ERROR")

print("\n" + "=" * 40)
print("PROACTIVE FIXES:")
print("1. The 2-minute timeout is from the CLI tool, not the games")
print("2. Games started with ./start-all-games.sh use nohup + disown")
print("3. These are SUPER SIMPLE clicker games - no complex features")
print("4. If a game doesn't work, check /tmp/game_PORT.log")
print("=" * 40)