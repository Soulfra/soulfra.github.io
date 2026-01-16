#!/usr/bin/env python3
"""
NO TIMEOUT LAUNCHER - Starts services without blocking
Returns immediately after starting services
"""

import subprocess
import time
import sys
import os

def start_service(name, script, port):
    """Start a service without blocking"""
    print(f"Starting {name} on port {port}...")
    
    # Kill any existing process on port
    os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
    time.sleep(0.5)
    
    # Start in background with proper detachment
    cmd = f"python3 -u {script} > logs/{name}.log 2>&1 &"
    subprocess.Popen(cmd, shell=True, 
                     stdout=subprocess.DEVNULL,
                     stderr=subprocess.DEVNULL,
                     preexec_fn=os.setsid)
    
    time.sleep(1)
    
    # Check if started
    result = os.system(f"curl -s http://localhost:{port} > /dev/null 2>&1")
    if result == 0:
        print(f"✓ {name} running on http://localhost:{port}")
    else:
        print(f"✗ {name} failed to start")
    
    return result == 0

def main():
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    print("=== NO TIMEOUT LAUNCHER ===")
    print("Starting all services...\n")
    
    # Services to start
    services = [
        ('text-game', 'TEXT_ONLY_GAME.py', 3456),
        ('json-api', 'NO_EMOJI_API.py', 4444),
        ('language-bridge', 'LANGUAGE_BRIDGE.py', 7777),
        ('master-router', 'MASTER_ROUTER.py', 8888),
    ]
    
    # Start all services
    success_count = 0
    for name, script, port in services:
        if start_service(name, script, port):
            success_count += 1
    
    print(f"\n{success_count}/{len(services)} services started successfully")
    print("\nServices are running in background. Check logs/ for output.")
    print("\nAccess points:")
    print("  Master Router: http://localhost:8888")
    print("  Language Bridge: http://localhost:7777")
    print("  Text Game: http://localhost:3456")
    print("  JSON API: http://localhost:4444")
    
    # Exit immediately - services continue in background
    sys.exit(0)

if __name__ == "__main__":
    main()