#!/usr/bin/env python3
"""
PROPER DIAGNOSTIC TEST
Actually checks what's working and what's broken
"""

import subprocess
import socket
import http.client
import time

def check_port(port):
    """Check if a port is open and listening"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

def check_http_response(port, path='/'):
    """Check HTTP response and look for formatting errors"""
    try:
        conn = http.client.HTTPConnection('localhost', port, timeout=5)
        conn.request('GET', path)
        response = conn.getresponse()
        data = response.read().decode('utf-8', errors='replace')
        
        # Check for common formatting error patterns
        errors = []
        if 'ðŸ' in data:
            errors.append('Broken emoji encoding')
        if 'â€™' in data or 'â€œ' in data:
            errors.append('Broken quote encoding')
        if 'Ã' in data:
            errors.append('UTF-8 encoding issues')
        if '�' in data:
            errors.append('Unicode replacement character')
            
        conn.close()
        return response.status, errors, len(data)
    except Exception as e:
        return None, [str(e)], 0

def check_process(pattern):
    """Check if a process is running"""
    try:
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        return pattern in result.stdout
    except:
        return False

print("=" * 60)
print("SOULFRA GAMES DIAGNOSTIC TEST")
print("=" * 60)
print()

# Define all games to test
games = [
    {'name': 'No Bullshit Arena', 'port': 5555, 'process': 'NO_BULLSHIT'},
    {'name': 'Ultimate Arena', 'port': 6666, 'process': 'ULTIMATE_GAME'},
    {'name': 'Character Creator', 'port': 6969, 'process': 'CHARACTER_CREATOR'},
    {'name': 'JS Character Battle', 'port': 8888, 'process': '8888'},
    {'name': 'JS No-Emoji Arena', 'port': 7777, 'process': '7777'},
    {'name': 'Launcher', 'port': 8000, 'process': 'LAUNCHER'},
]

working_games = []
broken_games = []

for game in games:
    print(f"\nTesting {game['name']} on port {game['port']}...")
    
    # Check if port is open
    port_open = check_port(game['port'])
    print(f"  Port {game['port']}: {'OPEN' if port_open else 'CLOSED'}")
    
    if port_open:
        # Check HTTP response
        status, errors, size = check_http_response(game['port'])
        
        if status == 200:
            print(f"  HTTP Status: 200 OK")
            print(f"  Response Size: {size} bytes")
            
            if errors:
                print(f"  FORMATTING ERRORS FOUND:")
                for error in errors:
                    print(f"    - {error}")
                broken_games.append(game['name'])
            else:
                print(f"  No formatting errors detected")
                working_games.append(game['name'])
        else:
            print(f"  HTTP Status: {status or 'No response'}")
            if errors:
                print(f"  Errors: {', '.join(errors)}")
            broken_games.append(game['name'])
    else:
        # Check if process exists but port isn't open
        process_running = check_process(game['process'])
        if process_running:
            print(f"  Process found but port not responding")
        else:
            print(f"  No process found")
        broken_games.append(game['name'])

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"\nWORKING GAMES ({len(working_games)}):")
for game in working_games:
    print(f"  ✓ {game}")

print(f"\nBROKEN GAMES ({len(broken_games)}):")
for game in broken_games:
    print(f"  ✗ {game}")

print("\nRECOMMENDATIONS:")
if len(working_games) == 0:
    print("  - No games are working! Start fresh:")
    print("    pkill -f 'GAME|game'")
    print("    python3 SIMPLE_WORKING_GAME.py &")
    print("    python3 SIMPLE_CHARACTER_GAME.py &")
else:
    print(f"  - Visit these working games:")
    if 'No Bullshit Arena' in working_games:
        print("    http://localhost:5555")
    if 'JS Character Battle' in working_games:
        print("    http://localhost:8888")
    if 'Launcher' in working_games:
        print("    http://localhost:8000")

print("\n" + "=" * 60)