#!/usr/bin/env python3
"""
SHOW ME THE ACTUAL GAMES - Not dashboards, REAL GAMES
"""

import os
import subprocess
import urllib.request
import socket

print("🎮 FINDING THE ACTUAL FUN GAMES")
print("=" * 60)
print("Not dashboards, not dev tools - ACTUAL GAMES like Habbo/RuneScape")
print()

# Game ports to check
game_ports = [
    (6969, "DRAG & DROP CHARACTER CREATOR", "Create custom characters by dragging images!"),
    (7777, "HABBO HOTEL ROOMS", "Walk around, chat, dance - like real Habbo!"),
    (3003, "GLADIATOR ARENA", "Roman Colosseum with AI gladiators!"),
    (7000, "MULTIPLAYER WEBSOCKET GAME", "Real multiplayer with other players!"),
    (5557, "BULLETPROOF PORTAL", "Fun zone games!"),
]

working_games = []

print("🔍 Checking for ACTUAL GAMES:\n")

for port, name, desc in game_ports:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        
        if result == 0:
            print(f"✅ {name} - RUNNING!")
            print(f"   📍 http://localhost:{port}")
            print(f"   🎮 {desc}")
            print()
            working_games.append((port, name, desc))
    except:
        pass

# Launch script for games
print("\n" + "=" * 60)

if working_games:
    print("🎮 PLAY THESE GAMES NOW:")
    print("=" * 60)
    
    for port, name, desc in working_games:
        print(f"\n🎯 {name}")
        print(f"   👉 http://localhost:{port}")
        print(f"   {desc}")
        
        if "HABBO" in name:
            print("   - Click rooms to join")
            print("   - Click to move your avatar") 
            print("   - Chat with other players")
            print("   - Dance with /dance command")
            
        elif "DRAG" in name:
            print("   - Drag ANY image onto the drop zone")
            print("   - Or paste an image URL")
            print("   - Your character gets custom stats!")
            print("   - Then play the arena game with YOUR character")
            
        elif "GLADIATOR" in name:
            print("   - Watch AI gladiators fight")
            print("   - Place bets on winners")
            print("   - Live Twitch-style chat")
            print("   - Progress to $1 billion goal")
            
else:
    print("❌ No games currently running. Let me launch them...")
    
    # Try to launch the games
    game_files = [
        ("DRAG_DROP_CHARACTER_CREATOR.py", 6969),
        ("HABBO_HOTEL_ROOMS.js", 7777),
        ("GLADIATOR_ARENA_GAME.js", 3003),
    ]
    
    game_dir = "/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/tier-0/tier-minus1/tier-minus2/tier-minus3/tier-minus4/tier-minus5/tier-minus6/tier-minus7/tier-minus8/tier-minus9/tier-minus10"
    
    for game_file, port in game_files:
        full_path = os.path.join(game_dir, game_file)
        if os.path.exists(full_path):
            print(f"\n🚀 Found {game_file}")
            
            if game_file.endswith('.py'):
                print(f"   Run: cd {game_dir} && python3 {game_file}")
            elif game_file.endswith('.js'):
                print(f"   Run: cd {game_dir} && node {game_file}")
                
            print(f"   Then visit: http://localhost:{port}")

print("\n" + "=" * 60)
print("💡 THESE ARE THE REAL GAMES:")
print("   - Visual characters you can see and control")
print("   - Drag & drop interfaces")  
print("   - Multiplayer interaction")
print("   - Actual gameplay, not just clicking buttons")
print("   - Fun and addictive like Habbo/RuneScape!")
print("=" * 60)