#!/usr/bin/env python3
"""
STATUS CHECKER - Quick check if everything is working
Run this anytime to see if services are up
"""

import urllib.request
import socket
import subprocess
import time

def check_port(port):
    """Check if port is in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1)
        return sock.connect_ex(('localhost', port)) == 0

def test_http(url):
    """Test if URL responds"""
    try:
        response = urllib.request.urlopen(url, timeout=3)
        return response.status == 200
    except:
        return False

def get_process_info(port):
    """Get process info for port"""
    try:
        result = subprocess.run(['lsof', '-ti', f':{port}'], 
                              capture_output=True, text=True, timeout=3)
        if result.stdout.strip():
            return result.stdout.strip()
    except:
        pass
    return None

def main():
    print("🔍 SOULFRA STATUS CHECK")
    print("=" * 50)
    print()
    
    services = [
        {'name': '🔥 Main Platform', 'port': 3333, 'url': 'http://localhost:3333'},
        {'name': '⚔️ AI Arena', 'port': 4444, 'url': 'http://localhost:4444'}
    ]
    
    all_good = True
    
    for service in services:
        print(f"Checking {service['name']}...")
        
        # Check port
        if check_port(service['port']):
            print(f"  ✅ Port {service['port']} is open")
            
            # Check HTTP response
            if test_http(service['url']):
                print(f"  ✅ Service responds to HTTP")
                print(f"  🌐 Access: {service['url']}")
                
                # Get process info
                pid = get_process_info(service['port'])
                if pid:
                    print(f"  📋 Process ID: {pid}")
                    
            else:
                print(f"  ❌ Port open but HTTP not responding")
                all_good = False
        else:
            print(f"  ❌ Port {service['port']} not open")
            all_good = False
            
        print()
    
    if all_good:
        print("🎉 ALL SERVICES ARE WORKING!")
        print("🔥 Soulfra ecosystem is fully operational")
        print()
        print("💡 If Claude Code shows 'timeout' - that's normal!")
        print("   The servers run in background - just use the URLs above")
    else:
        print("⚠️  Some services are down")
        print("🚀 Run: python3 BULLETPROOF_LAUNCHER.py")
        
    print()
    print("🔄 Run this script anytime to check status")

if __name__ == '__main__':
    main()