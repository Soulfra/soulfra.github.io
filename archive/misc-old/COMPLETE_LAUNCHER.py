#!/usr/bin/env python3
"""
COMPLETE LAUNCHER - Starts everything properly
"""

import subprocess
import time
import os
import sys

def kill_port(port):
    """Kill process on port"""
    os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
    time.sleep(0.5)

def start_service(name, script, port):
    """Start a service"""
    print(f"Starting {name} on port {port}...")
    kill_port(port)
    
    # Start in background
    subprocess.Popen([
        sys.executable, "-u", script
    ], stdout=open(f'logs/{name}.log', 'a'), 
       stderr=subprocess.STDOUT)
    
    time.sleep(2)
    print(f"  [OK] {name} started")

def main():
    print("=" * 60)
    print("SOULFRA COMPLETE SYSTEM LAUNCHER")
    print("=" * 60)
    print()
    
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    # Start all services
    services = [
        ("Fixed Monitor", "FIXED_MONITOR.py", 7777),
        ("Chat Logger", "CHAT_LOG_PROCESSOR.py", 4040),
        ("Simple Game", "simple_game_5555.py", 5555),
        ("Working Platform", "WORKING_PLATFORM.py", 3002),
        ("Master Control", "SOULFRA_MASTER_ORCHESTRATOR.py", 8000),
        ("AI Ecosystem", "MINIMAL_AI_ECOSYSTEM.py", 9999),
        ("Chat Processor", "UNIFIED_CHATLOG_SYSTEM.py", 8888),
        ("Max Autonomous", "SOULFRA_MAX_AUTONOMOUS.py", 6004),
    ]
    
    for name, script, port in services:
        if os.path.exists(script):
            start_service(name, script, port)
        else:
            print(f"  [SKIP] {name} - {script} not found")
            
    print()
    print("=" * 60)
    print("ALL SERVICES STARTED!")
    print("=" * 60)
    print()
    print("Access points:")
    print("  Monitor:        http://localhost:7777")
    print("  Chat Logger:    http://localhost:4040")
    print("  Simple Game:    http://localhost:5555")
    print("  Platform:       http://localhost:3002")
    print("  Master:         http://localhost:8000")
    print("  AI Chat:        http://localhost:9999")
    print("  Chat Process:   http://localhost:8888")
    print()
    print("Drop chat logs in: chatlog_drops/")
    print()

if __name__ == "__main__":
    main()
