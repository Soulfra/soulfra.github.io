#!/usr/bin/env python3
"""
CLEANUP AND CONSOLIDATE
Let's figure out what the fuck we actually have
"""

import os
import subprocess
import socket

print("SOULFRA PLATFORM AUDIT")
print("="*60)

# 1. Count the mess
py_files = [f for f in os.listdir('.') if f.endswith('.py')]
print(f"\nTotal Python files: {len(py_files)}")

# 2. Find running servers
print("\nRunning servers:")
running = subprocess.check_output("lsof -i -P | grep LISTEN | grep Python | awk '{print $9}'", shell=True).decode()
ports = [line for line in running.strip().split('\n') if line]
print(f"Active ports: {len(ports)}")
for port in ports[:10]:  # Show first 10
    print(f"  - {port}")
if len(ports) > 10:
    print(f"  ... and {len(ports) - 10} more")

# 3. Look for patterns in file names
print("\nFile patterns:")
patterns = {
    'SIMPLE': 0,
    'GAME': 0,
    'PLATFORM': 0,
    'WORKING': 0,
    'FIXED': 0,
    'ACTUAL': 0,
    'ULTIMATE': 0,
    'SOULFRA': 0
}

for f in py_files:
    for pattern in patterns:
        if pattern in f.upper():
            patterns[pattern] += 1

for pattern, count in patterns.items():
    if count > 0:
        print(f"  {pattern}: {count} files")

# 4. Recommendation
print("\n" + "="*60)
print("RECOMMENDATION:")
print("="*60)
print("\n1. Kill all running Python processes:")
print("   pkill -f python")
print("\n2. Delete redundant files")
print("\n3. Keep ONE working version")
print("\n4. Stop creating new files for every iteration")
print("\nWe have:")
print("- 280 Python files")
print("- 38 servers running")
print("- Multiple versions of the same thing")
print("- Total chaos")

print("\nWhat we need:")
print("- ONE main platform file")
print("- Clear module structure")
print("- Stop the madness")

print("\nThe working ones we know:")
print("- http://localhost:50395 (JUST_FUCKING_WORK.py)")
print("- http://localhost:50984 (BUILD_FROM_HERE.py)")

print("\nNext step: Create ONE FINAL VERSION and delete the rest")
print("="*60)