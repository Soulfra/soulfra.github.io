#!/usr/bin/env python3
"""
CODE GPS SIMPLE - No dependencies needed
Quick analysis of SOULFRA chaos
"""

import os
import json
import hashlib
from pathlib import Path
from collections import defaultdict
import re

def scan_soulfra():
    """Quick scan of SOULFRA files"""
    print("🔍 Scanning SOULFRA project...")
    
    files = {}
    duplicates = defaultdict(list)
    ports = defaultdict(list)
    
    # Find all Python files
    for py_file in Path('.').rglob('*.py'):
        if 'venv' in str(py_file) or '__pycache__' in str(py_file):
            continue
            
        try:
            content = py_file.read_text(errors='ignore')
            file_hash = hashlib.md5(content.encode()).hexdigest()[:8]
            
            # Extract ports
            port_matches = re.findall(r'port[:\s=]*(\d{4,5})', content, re.IGNORECASE)
            
            files[str(py_file)] = {
                'hash': file_hash,
                'lines': len(content.splitlines()),
                'size': py_file.stat().st_size,
                'ports': list(set(int(p) for p in port_matches if 1000 < int(p) < 65535))
            }
            
            duplicates[file_hash].append(str(py_file))
            
            for port in files[str(py_file)]['ports']:
                ports[port].append(str(py_file))
                
        except Exception as e:
            print(f"⚠️  Error reading {py_file}: {e}")
            
    return files, duplicates, ports

def analyze_platforms(files):
    """Find all platform implementations"""
    platforms = {
        'ultimate': [],
        'unified': [],
        'simple': [],
        'working': [],
        'other': []
    }
    
    for file_path in files:
        name = Path(file_path).name.upper()
        
        if 'ULTIMATE' in name:
            platforms['ultimate'].append(file_path)
        elif 'UNIFIED' in name:
            platforms['unified'].append(file_path)
        elif 'SIMPLE' in name:
            platforms['simple'].append(file_path)
        elif 'WORKING' in name:
            platforms['working'].append(file_path)
        else:
            platforms['other'].append(file_path)
            
    return platforms

def main():
    print("""
🧭 CODE GPS SIMPLE - SOULFRA Analysis
====================================
    """)
    
    # Scan files
    files, duplicates, ports = scan_soulfra()
    
    print(f"\n📊 SCAN RESULTS:")
    print(f"  Total Python files: {len(files)}")
    print(f"  Duplicate groups: {sum(len(f) > 1 for f in duplicates.values())}")
    print(f"  Port conflicts: {sum(len(f) > 1 for f in ports.values())}")
    
    # Show duplicates
    print(f"\n🔄 DUPLICATE FILES:")
    for file_hash, file_list in duplicates.items():
        if len(file_list) > 1:
            print(f"\n  Hash {file_hash} ({len(file_list)} copies):")
            # Sort by size to find best version
            sorted_files = sorted(file_list, key=lambda f: files[f]['lines'], reverse=True)
            for i, f in enumerate(sorted_files):
                marker = "✅ BEST" if i == 0 else "❌"
                print(f"    {marker} {f} ({files[f]['lines']} lines)")
                
    # Show port conflicts
    print(f"\n🚪 PORT CONFLICTS:")
    for port, file_list in ports.items():
        if len(file_list) > 1:
            print(f"\n  Port {port} used by:")
            for f in file_list:
                print(f"    - {f}")
                
    # Analyze platforms
    platforms = analyze_platforms(files)
    
    print(f"\n🎮 PLATFORM IMPLEMENTATIONS:")
    for category, file_list in platforms.items():
        if file_list:
            print(f"\n  {category.title()} versions: {len(file_list)}")
            for f in file_list[:3]:
                print(f"    - {Path(f).name} ({files[f]['lines']} lines)")
                
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    
    # Find best main platform
    all_platforms = []
    for file_path, info in files.items():
        if 'SOULFRA' in file_path.upper() and info['lines'] > 100:
            all_platforms.append((info['lines'], file_path))
            
    if all_platforms:
        all_platforms.sort(reverse=True)
        best_platform = all_platforms[0][1]
        print(f"\n  1. Use {Path(best_platform).name} as main platform ({files[best_platform]['lines']} lines)")
        
    print(f"  2. Remove {sum(len(f) - 1 for f in duplicates.values() if len(f) > 1)} duplicate files")
    print(f"  3. Standardize on port 7777 for main service")
    print(f"  4. Create single launch script with auto-restart")
    
    # Generate simple report
    report = {
        'total_files': len(files),
        'duplicates': sum(len(f) - 1 for f in duplicates.values() if len(f) > 1),
        'port_conflicts': sum(len(f) > 1 for f in ports.values()),
        'recommendations': {
            'main_file': Path(best_platform).name if all_platforms else 'Create new unified platform',
            'ports_to_fix': list(ports.keys()),
            'files_to_remove': sum(len(f) - 1 for f in duplicates.values() if len(f) > 1)
        }
    }
    
    with open('code_gps_simple_report.json', 'w') as f:
        json.dump(report, f, indent=2)
        
    print(f"\n✅ Report saved to: code_gps_simple_report.json")
    print(f"\n🎯 Next: Run the cleanup script to fix everything!")

if __name__ == "__main__":
    main()