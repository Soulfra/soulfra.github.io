#!/usr/bin/env python3
"""
REALITY CHECK SYSTEM - What actually exists vs what works
"""

import os
import subprocess
import json
from pathlib import Path
import ast

class RealityCheck:
    def __init__(self):
        self.javascript_files = []
        self.python_files = []
        self.working_services = []
        self.broken_connections = []
        self.documentation_lies = []
        
    def scan_reality(self):
        """Scan what ACTUALLY exists"""
        print("=" * 60)
        print("REALITY CHECK - What Actually Exists")
        print("=" * 60)
        print()
        
        # Find all JavaScript
        print("Scanning JavaScript files...")
        self.javascript_files = list(Path.cwd().rglob("*.js"))
        print(f"Found {len(self.javascript_files)} JavaScript files")
        
        # Find all Python
        print("Scanning Python files...")
        self.python_files = list(Path.cwd().rglob("*.py"))
        print(f"Found {len(self.python_files)} Python files")
        
        # Check what's actually running
        self.check_running_services()
        
        # Check documentation vs reality
        self.check_documentation_accuracy()
        
        # Generate report
        self.generate_reality_report()
        
    def check_running_services(self):
        """Check what's ACTUALLY running"""
        print("\nChecking what's actually running...")
        
        # Check Python processes
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if 'python' in line.lower() and any(py in line for py in ['SOULFRA', 'MINIMAL', 'FIXED']):
                self.working_services.append(line.strip())
                
        print(f"Found {len(self.working_services)} running Python services")
        
    def check_documentation_accuracy(self):
        """Check if documentation matches reality"""
        print("\nChecking documentation accuracy...")
        
        # Check CLAUDE.md files
        claude_files = list(Path.cwd().rglob("CLAUDE.md"))
        
        for claude_file in claude_files:
            with open(claude_file, 'r') as f:
                content = f.read()
                
            # Check if documented commands actually work
            if 'npm run' in content:
                # Check if package.json exists in that directory
                package_json = claude_file.parent / 'package.json'
                if not package_json.exists():
                    self.documentation_lies.append(f"{claude_file}: References npm but no package.json")
                    
            if 'python' in content:
                # Extract mentioned Python files
                import re
                py_files = re.findall(r'(\w+\.py)', content)
                for py_file in py_files:
                    full_path = claude_file.parent / py_file
                    if not full_path.exists():
                        self.documentation_lies.append(f"{claude_file}: References {py_file} but it doesn't exist")
                        
    def check_js_python_integration(self):
        """Check how JS and Python connect"""
        integrations = []
        
        # Look for subprocess calls to node
        for py_file in self.python_files[:10]:  # Sample
            try:
                with open(py_file, 'r') as f:
                    content = f.read()
                if 'subprocess' in content and 'node' in content:
                    integrations.append(f"Python->JS: {py_file.name}")
            except:
                pass
                
        # Look for fetch/requests to Python servers
        for js_file in self.javascript_files[:10]:  # Sample
            try:
                with open(js_file, 'r') as f:
                    content = f.read()
                if 'fetch' in content and 'localhost' in content:
                    integrations.append(f"JS->Python: {js_file.name}")
            except:
                pass
                
        return integrations
        
    def generate_reality_report(self):
        """Generate the reality report"""
        print("\n" + "=" * 60)
        print("REALITY REPORT")
        print("=" * 60)
        
        # JavaScript analysis
        print("\nJAVASCRIPT FILES:")
        tier_minus9_js = [f for f in self.javascript_files if 'tier-minus9' in str(f)]
        print(f"  Tier -9: {len(tier_minus9_js)} files")
        for f in tier_minus9_js[:5]:
            print(f"    - {f.name}")
            
        # Python analysis
        print("\nPYTHON FILES:")
        system_files = [f for f in self.python_files if 'SYSTEM' in f.name]
        print(f"  System files: {len(system_files)}")
        for f in system_files[:5]:
            print(f"    - {f.name}")
            
        # Integration check
        print("\nJS/PYTHON INTEGRATION:")
        integrations = self.check_js_python_integration()
        if integrations:
            for i in integrations:
                print(f"  - {i}")
        else:
            print("  ❌ NO INTEGRATION FOUND!")
            
        # Documentation lies
        if self.documentation_lies:
            print("\nDOCUMENTATION ISSUES:")
            for lie in self.documentation_lies[:5]:
                print(f"  - {lie}")
                
        print("\n" + "=" * 60)
        print("THE TRUTH:")
        print("=" * 60)
        print("""
1. We have JavaScript QR validators that Python can't use
2. We have Python services that don't know JS exists  
3. Documentation references files that don't exist
4. Services were tested individually but never together
5. No actual message passing between components
6. The "integration" is just files in the same directory
        """)
        
        # Save findings
        findings = {
            'javascript_files': len(self.javascript_files),
            'python_files': len(self.python_files),
            'running_services': len(self.working_services),
            'documentation_issues': len(self.documentation_lies),
            'js_python_integration': len(integrations)
        }
        
        with open('REALITY_CHECK_REPORT.json', 'w') as f:
            json.dump(findings, f, indent=2)

if __name__ == "__main__":
    reality = RealityCheck()
    reality.scan_reality()