#!/usr/bin/env python3
"""
TEST SOULFRA SIMPLE
Just test what actually works
"""

import subprocess
import time
import os
import sys

print("🧪 TESTING SOULFRA COMPONENTS...")
print("=" * 60)

# Test 1: Can we run the integrated hub?
print("\n[TEST 1] Integrated Hub")
if os.path.exists('soulfra_integrated_hub.py'):
    print("  ✓ Hub file exists")
    # Try to run it briefly
    try:
        process = subprocess.Popen(
            [sys.executable, 'soulfra_integrated_hub.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(2)
        
        if process.poll() is None:
            print("  ✓ Hub is running!")
            # Check output
            stdout = process.stdout.read(100).decode() if process.stdout else ""
            if stdout:
                print(f"  Output: {stdout[:50]}...")
            process.terminate()
        else:
            stderr = process.stderr.read().decode()
            print(f"  ✗ Hub crashed: {stderr[:200]}")
    except Exception as e:
        print(f"  ✗ Failed to start: {e}")
else:
    print("  ✗ Hub file not found")

# Test 2: Check for game files
print("\n[TEST 2] Game Files")
game_files = ['FIXED_3D_PLAZA.py', 'ARENA_GAME.py', 'AI_COLOSSEUM.py', 
              'BILLION_DOLLAR_GAME.py', 'SIMPLE_WORKING_GAME.py']
found_games = []
for game in game_files:
    if os.path.exists(game):
        found_games.append(game)
        print(f"  ✓ Found: {game}")
        
if not found_games:
    print("  ✗ No game files found")

# Test 3: Check for economy/token files
print("\n[TEST 3] Economy Systems")
economy_files = ['VIBE_TOKEN_ECONOMY.py', 'ECONOMY_ENGINE.py', 
                 'DUEL_ENGINE.py', 'BILLION_DOLLAR_COLLECTIVE.py']
found_economy = []
for econ in economy_files:
    if os.path.exists(econ):
        found_economy.append(econ)
        print(f"  ✓ Found: {econ}")
        
# Test 4: Check for AI/Agent files
print("\n[TEST 4] AI Systems")
ai_files = ['SOULFRA_AI_SOCIAL_NETWORK.py', 'SOULFRA_SIMS_DASHBOARD.py',
            'SMART_LOG_PROCESSOR.py', 'SEMANTIC_AGENT_FACTORY.py']
found_ai = []
for ai in ai_files:
    if os.path.exists(ai):
        found_ai.append(ai)
        print(f"  ✓ Found: {ai}")

# Test 5: Test a simple HTTP server
print("\n[TEST 5] Simple Web Server")
try:
    # Create test HTML
    os.makedirs('/tmp/soulfra_test', exist_ok=True)
    with open('/tmp/soulfra_test/index.html', 'w') as f:
        f.write('<h1>SOULFRA TEST</h1><p>If you see this, web serving works!</p>')
    
    # Start server
    server = subprocess.Popen(
        [sys.executable, '-m', 'http.server', '9999', '--directory', '/tmp/soulfra_test'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(1)
    
    if server.poll() is None:
        print("  ✓ Web server works! Test at: http://localhost:9999")
        server.terminate()
    else:
        print("  ✗ Web server failed")
except Exception as e:
    print(f"  ✗ Web server error: {e}")

# Summary
print("\n" + "=" * 60)
print("📊 SUMMARY:")
print(f"  Games found: {len(found_games)}")
print(f"  Economy systems: {len(found_economy)}")
print(f"  AI systems: {len(found_ai)}")
print("\n💡 RECOMMENDATION:")

if found_games:
    print(f"  Try running: python3 {found_games[0]}")
if found_economy:
    print(f"  Try running: python3 {found_economy[0]}")
if found_ai:
    print(f"  Try running: python3 {found_ai[0]}")
    
print("\n✨ For integrated experience, try:")
print("  python3 SOULFRA_MEGA_INTEGRATION.py")
print("  python3 SOULFRA_ULTIMATE_LAUNCHER.py")