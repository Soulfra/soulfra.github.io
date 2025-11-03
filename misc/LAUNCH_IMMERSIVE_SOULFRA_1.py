#!/usr/bin/env python3
"""
LAUNCH IMMERSIVE SOULFRA - Using our smart port manager
Actually use the tools we built instead of being stupid
"""

import os
import sys
import subprocess
import time
import json
import urllib.request

# Import our unfuckable port manager
from UNFUCKABLE_PORT_MANAGER import UnfuckablePortManager

def launch_immersive_soulfra():
    print("🌌 LAUNCHING IMMERSIVE SOULFRA EXPERIENCE")
    print("=" * 60)
    print("Using UNFUCKABLE PORT MANAGER - No more port issues!")
    print()
    
    # Initialize port manager
    port_manager = UnfuckablePortManager()
    
    # Services to launch
    services = [
        {
            'name': 'immersive_portal',
            'file': 'SOULFRA_IMMERSIVE_PORTAL.py',
            'port_key': 'immersion',
            'display_name': '🌌 Immersive Portal'
        },
        {
            'name': 'fight_viewer',
            'file': 'MAXED_FIGHT_VIEWER.py', 
            'port_key': 'viewer',
            'display_name': '👁️ Fight Viewer'
        },
        {
            'name': 'automation',
            'file': 'AUTOMATED_FIGHT_LAYER.py',
            'port_key': 'automation',
            'display_name': '🤖 Automation Layer'
        },
        {
            'name': 'universe',
            'file': 'ULTIMATE_SOULFRA_UNIVERSE.py',
            'port_key': 'universe', 
            'display_name': '🌌 Universe Portal'
        },
        {
            'name': 'arena',
            'file': 'AI_VS_AI_ARENA.py',
            'port_key': 'arena',
            'display_name': '⚔️ AI Arena'
        }
    ]
    
    # Update the immersive portal to use smart port
    immersion_port = port_manager.find_available_port(5555, 'immersion')
    
    # Update SOULFRA_IMMERSIVE_PORTAL.py with the correct port
    with open('SOULFRA_IMMERSIVE_PORTAL.py', 'r') as f:
        content = f.read()
    
    # Replace port 7777 with the smart port
    content = content.replace('7777', str(immersion_port))
    
    with open('SOULFRA_IMMERSIVE_PORTAL.py', 'w') as f:
        f.write(content)
    
    # Also update fight viewer port
    viewer_port = port_manager.find_available_port(8080, 'viewer')
    
    # Launch services
    launched = []
    
    for service in services:
        print(f"\n🚀 Launching {service['display_name']}...")
        
        # Get smart port
        if service['port_key'] == 'viewer':
            port = viewer_port
        elif service['port_key'] == 'immersion':
            port = immersion_port
        else:
            port = port_manager.find_available_port(
                port_manager.default_ports.get(service['port_key'], 9000),
                service['port_key']
            )
        
        if not port:
            print(f"❌ Could not find port for {service['name']}")
            continue
            
        # Kill any existing process
        port_manager.kill_port(port)
        time.sleep(1)
        
        # Launch the service
        try:
            process = subprocess.Popen(
                [sys.executable, service['file']],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
            
            print(f"✅ Started {service['display_name']} (PID: {process.pid})")
            
            # Test if it's working
            time.sleep(3)
            for i in range(10):
                try:
                    response = urllib.request.urlopen(f'http://localhost:{port}', timeout=2)
                    if response.status == 200:
                        print(f"✅ {service['display_name']}: LIVE at http://localhost:{port}")
                        launched.append({
                            'name': service['display_name'],
                            'port': port,
                            'url': f'http://localhost:{port}'
                        })
                        break
                except:
                    if i < 9:
                        time.sleep(1)
                    else:
                        print(f"⚠️  {service['display_name']} not responding yet")
                        
        except Exception as e:
            print(f"❌ Failed to launch {service['name']}: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("🌌 IMMERSIVE SOULFRA LAUNCH COMPLETE")
    print("=" * 60)
    
    if launched:
        print("\n🔥 LIVE SERVICES:")
        for service in launched:
            print(f"  {service['name']}: {service['url']}")
            
        print("\n🎯 START HERE:")
        immersive_url = next((s['url'] for s in launched if 'Immersive' in s['name']), None)
        if immersive_url:
            print(f"  👉 {immersive_url} - IMMERSIVE CONSCIOUSNESS PORTAL")
            print("\n📋 FEATURES:")
            print("  • First-person consciousness interface")
            print("  • Whisper-to-reality manifestation")
            print("  • Neural sync visualization")
            print("  • Portal gates to all systems")
            print("  • Sacred document generation")
            print("  • Live consciousness events")
            
    else:
        print("\n❌ No services launched successfully")
        
    print("\n💡 TIP: The services keep running even after Claude times out!")
    print("   Just visit the URLs to see everything working")

if __name__ == '__main__':
    launch_immersive_soulfra()