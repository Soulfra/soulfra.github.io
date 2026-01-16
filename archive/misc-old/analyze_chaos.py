#!/usr/bin/env python3
"""
Quick analysis of SOULFRA chaos
"""

import os
from pathlib import Path
import re

def analyze():
    # Key files to check
    key_files = [
        'SOULFRA_ULTIMATE_PLATFORM.py',
        'SOULFRA_UNIFIED_MOBILE.py', 
        'SOULFRA_UNIFIED_PLATFORM.py',
        'VIBE_TOKEN_ECONOMY.py',
        'PERSONALITY_MARKETPLACE.py'
    ]
    
    results = {}
    
    for filename in key_files:
        if Path(filename).exists():
            with open(filename, 'r', errors='ignore') as f:
                content = f.read()
                
            # Extract key info
            lines = len(content.splitlines())
            ports = re.findall(r'port[:\s=]*(\d{4,5})', content, re.IGNORECASE)
            has_stripe = 'stripe' in content.lower()
            has_socketio = 'socketio' in content.lower()
            has_mobile = 'mobile' in content.lower() or 'pwa' in content.lower()
            
            results[filename] = {
                'lines': lines,
                'ports': list(set(ports)),
                'has_stripe': has_stripe,
                'has_socketio': has_socketio,
                'has_mobile': has_mobile,
                'score': lines + (100 if has_stripe else 0) + (100 if has_mobile else 0)
            }
            
    # Print results
    print("🔍 SOULFRA CHAOS ANALYSIS")
    print("=" * 50)
    
    for filename, info in sorted(results.items(), key=lambda x: x[1]['score'], reverse=True):
        print(f"\n📄 {filename}")
        print(f"   Lines: {info['lines']}")
        print(f"   Ports: {info['ports']}")
        print(f"   Features: {'💳' if info['has_stripe'] else ''}{'📱' if info['has_mobile'] else ''}{'🔌' if info['has_socketio'] else ''}")
        print(f"   Score: {info['score']}")
        
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    if results:
        best = max(results.items(), key=lambda x: x[1]['score'])
        print(f"   Best starting point: {best[0]}")
        print(f"   Reason: {best[1]['lines']} lines, mobile={'Yes' if best[1]['has_mobile'] else 'No'}")
    
    # Count total SOULFRA files
    soulfra_count = len(list(Path('.').glob('*SOULFRA*.py')))
    print(f"\n   Total SOULFRA implementations: {soulfra_count}")
    print("   Action: Consolidate to ONE clean implementation!")

if __name__ == "__main__":
    analyze()