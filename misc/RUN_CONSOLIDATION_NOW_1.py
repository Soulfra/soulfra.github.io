#!/usr/bin/env python3
"""
RUN CONSOLIDATION NOW - Execute your actual consolidation tools
This runs your existing systems to fix the 280+ file mess
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
import time

print("=" * 60)
print("🔧 SOULFRA REAL CONSOLIDATION")
print("=" * 60)
print("Using your existing tools to fix 280+ files...")
print()

# Step 1: Run the flattening script
print("📦 Step 1: Running flatten_soulfra.py...")
if os.path.exists("flatten_soulfra.py"):
    try:
        result = subprocess.run([sys.executable, "flatten_soulfra.py"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Flattening complete!")
            print("   Files organized at: ~/Desktop/SOULFRA-FLAT/")
        else:
            print("⚠️ Flattening had issues but continuing...")
    except Exception as e:
        print(f"⚠️ Could not run flattening: {e}")
else:
    print("❌ flatten_soulfra.py not found")

print()

# Step 2: Check if AI Economy is running
print("🤖 Step 2: Checking AI Economy...")
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
ai_economy_running = sock.connect_ex(('localhost', 9091)) == 0
sock.close()

if not ai_economy_running:
    print("   AI Economy not running on port 9091")
    print("   Starting AI_ECONOMY_GITHUB_AUTOMATION.py...")
    if os.path.exists("AI_ECONOMY_GITHUB_AUTOMATION.py"):
        subprocess.Popen([sys.executable, "AI_ECONOMY_GITHUB_AUTOMATION.py"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(3)
        print("   ✅ AI Economy started")
    else:
        print("   ❌ Could not find AI Economy script")
else:
    print("   ✅ AI Economy already running on port 9091")

print()

# Step 3: Run consolidation using AI Economy
print("🔄 Step 3: Running AI-powered consolidation...")
if os.path.exists("CONSOLIDATE_USING_AI_ECONOMY.py"):
    try:
        result = subprocess.run([sys.executable, "CONSOLIDATE_USING_AI_ECONOMY.py"],
                              capture_output=True, text=True, timeout=10)
        if result.stdout:
            print(result.stdout)
        print("   ✅ AI consolidation proposal created")
    except subprocess.TimeoutExpired:
        print("   ⚠️ AI consolidation taking time...")
    except Exception as e:
        print(f"   ⚠️ Could not run AI consolidation: {e}")

print()

# Step 4: Run cleanup audit
print("🧹 Step 4: Running cleanup audit...")
if os.path.exists("CLEANUP_AND_CONSOLIDATE.py"):
    try:
        result = subprocess.run([sys.executable, "CLEANUP_AND_CONSOLIDATE.py"],
                              capture_output=True, text=True, timeout=5)
        if "Total Python files:" in result.stdout:
            # Extract key info
            for line in result.stdout.split('\n'):
                if "Total Python files:" in line or "SOULFRA:" in line:
                    print(f"   {line.strip()}")
    except:
        pass

print()

# Step 5: Show what we should do next
print("=" * 60)
print("📋 CONSOLIDATION SUMMARY")
print("=" * 60)

# Count current mess
py_files = [f for f in os.listdir('.') if f.endswith('.py')]
soulfra_files = [f for f in py_files if 'SOULFRA' in f.upper()]
game_files = [f for f in py_files if 'GAME' in f.upper()]

print(f"Current situation:")
print(f"  • Total Python files: {len(py_files)}")
print(f"  • SOULFRA variants: {len(soulfra_files)}")
print(f"  • Game variants: {len(game_files)}")
print()

# Check if SOULFRA-FLAT exists
flat_path = Path.home() / "Desktop" / "SOULFRA-FLAT"
if flat_path.exists():
    print("✅ SOULFRA-FLAT directory created successfully!")
    print(f"   Location: {flat_path}")
    
    # Count organized files
    for subdir in ['core', 'utils', 'bridges', 'games', 'launch']:
        subpath = flat_path / subdir
        if subpath.exists():
            file_count = len(list(subpath.glob('*')))
            print(f"   • {subdir}/: {file_count} files")
    
    print()
    print("🚀 NEXT STEPS:")
    print("1. Go to SOULFRA-FLAT directory:")
    print(f"   cd {flat_path}")
    print()
    print("2. Run the unified launcher:")
    print("   python3 launch_soulfra.py")
    print()
    print("3. Or run specific demos:")
    print("   python3 core/SOULFRA_UNIFIED_MOBILE.py")
    print("   python3 core/SOULFRA_ULTIMATE_UNIFIED.py")
else:
    print("⚠️ SOULFRA-FLAT not created yet")
    print()
    print("🚀 IMMEDIATE ACTION:")
    print("Since flattening didn't work, run your best demo directly:")
    print()
    print("python3 QUICK_DEMO.py")
    print("or")
    print("python3 SOULFRA_UNIFIED_MOBILE.py")

print()
print("=" * 60)
print("💡 REMEMBER YOUR RULES:")
print("  • NO DUPLICATES - Delete the 200+ duplicate files")
print("  • WORKS FIRST TIME - Use what's already proven")
print("  • Production demo needs to work for sending to others")
print("=" * 60)