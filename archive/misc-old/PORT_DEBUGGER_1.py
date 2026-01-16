#!/usr/bin/env python3
"""
PORT DEBUGGER - Figure out why some ports work and others don't
"""

import socket
import subprocess
import os
import time

def test_port_binding(port):
    """Test if we can bind to a port"""
    try:
        # Try to create a socket and bind
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(('', port))
        sock.close()
        return True, "Can bind to port"
    except OSError as e:
        return False, f"Cannot bind: {e}"

def check_port_in_use(port):
    """Check if port is in use"""
    try:
        result = subprocess.run(
            f"lsof -i :{port} | grep LISTEN",
            shell=True,
            capture_output=True,
            text=True
        )
        if result.stdout:
            return True, result.stdout.strip()
        return False, "Port not in use"
    except:
        return False, "Could not check"

def kill_port(port):
    """Kill process on port"""
    try:
        os.system(f"lsof -ti :{port} | xargs kill -9 2>/dev/null")
        time.sleep(1)
        return True
    except:
        return False

print("PORT DEBUGGER")
print("=" * 60)

# Test multiple ports
test_ports = [5555, 6666, 6667, 6969, 7777, 8000, 8888, 9000]

for port in test_ports:
    print(f"\nTesting port {port}:")
    print("-" * 40)
    
    # Check if in use
    in_use, info = check_port_in_use(port)
    if in_use:
        print(f"  Currently in use: {info[:50]}...")
    else:
        print(f"  Not in use")
    
    # Kill and test binding
    if in_use:
        print(f"  Killing process on port {port}...")
        kill_port(port)
    
    # Test binding
    can_bind, msg = test_port_binding(port)
    if can_bind:
        print(f"  ✅ Can bind to port {port}")
    else:
        print(f"  ❌ Cannot bind to port {port}: {msg}")

print("\n" + "=" * 60)
print("HYPOTHESIS:")
print("- Ports 6666-6667 might be reserved or blocked")
print("- Some old processes might be zombies")
print("- Let's use different ports that definitely work")
print("=" * 60)

# Test some alternative ports
print("\nTesting alternative ports...")
alt_ports = [3000, 3001, 4000, 4001, 5000, 5001]

working_ports = []
for port in alt_ports:
    can_bind, _ = test_port_binding(port)
    if can_bind:
        working_ports.append(port)
        print(f"✅ Port {port} is available")

print(f"\nRECOMMENDED PORTS: {', '.join(map(str, working_ports[:4]))}")
print("\nUse these ports instead of 6666/6667!")