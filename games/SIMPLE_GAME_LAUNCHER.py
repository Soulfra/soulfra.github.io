#!/usr/bin/env python3
import subprocess
import time
import os

games = [
    ("FINAL_SIMPLE.py", 13000, "Simple Click Game"),
    ("HABBO_SIMPLE.py", 13001, "Habbo Style Game"),
    ("RUNESCAPE_SIMPLE.py", 13002, "RuneScape Style Game")
]

print("=== SIMPLE GAME LAUNCHER ===")
print("Starting games...")

processes = []

for game_file, port, name in games:
    if os.path.exists(game_file):
        print(f"\nLaunching {name} on port {port}...")
        try:
            proc = subprocess.Popen(['python3', game_file])
            processes.append(proc)
            print(f"✓ {name} running at http://localhost:{port}")
        except Exception as e:
            print(f"✗ Failed to launch {name}: {e}")
    else:
        print(f"✗ {game_file} not found")

print("\n=== ALL GAMES LAUNCHED ===")
print("\nAvailable games:")
for _, port, name in games:
    print(f"- {name}: http://localhost:{port}")

print("\nPress Ctrl+C to stop all games")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nStopping all games...")
    for proc in processes:
        proc.terminate()
    print("Done!")