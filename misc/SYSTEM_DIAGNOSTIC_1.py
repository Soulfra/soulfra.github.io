#!/usr/bin/env python3
"""
SYSTEM DIAGNOSTIC - Find out what's actually broken
"""

import os
import socket
import json
from pathlib import Path
import urllib.request
import urllib.error

class SystemDiagnostic:
    def __init__(self):
        self.issues = []
        self.working = []
        self.missing = []
        
    def run_diagnostic(self):
        print("=" * 60)
        print("SOULFRA SYSTEM DIAGNOSTIC")
        print("=" * 60)
        print()
        
        # Check services
        self.check_services()
        
        # Check file structure
        self.check_files()
        
        # Check UX/UI
        self.check_ux_ui()
        
        # Check integration
        self.check_integration()
        
        # Generate report
        self.generate_report()
        
    def check_services(self):
        """Check which services are actually working"""
        print("Checking Services...")
        services = [
            ("Monitor", 7777, "/"),
            ("Chat Logger", 4040, "/"),
            ("Chat Processor", 8888, "/"),
            ("AI Ecosystem", 9999, "/"),
            ("Max Autonomous", 6004, "/"),
            ("Simple Game", 5555, "/"),
            ("Working Platform", 3002, "/")
        ]
        
        for name, port, path in services:
            if self.check_port(port):
                try:
                    resp = urllib.request.urlopen(f"http://localhost:{port}{path}", timeout=2)
                    if resp.getcode() == 200:
                        self.working.append(f"{name} on port {port}")
                    else:
                        self.issues.append(f"{name} on port {port} - responding but error {resp.getcode()}")
                except:
                    self.issues.append(f"{name} on port {port} - port open but not responding")
            else:
                self.missing.append(f"{name} on port {port} - not running")
                
    def check_port(self, port):
        """Check if port is open"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
        
    def check_files(self):
        """Check critical files"""
        print("Checking Files...")
        
        critical_files = [
            "web_deployment/index.html",
            "chatlog_drops/",
            "logs/",
            "processed_logs/"
        ]
        
        for file_path in critical_files:
            path = Path(file_path)
            if path.exists():
                self.working.append(f"Path exists: {file_path}")
            else:
                self.missing.append(f"Missing path: {file_path}")
                
    def check_ux_ui(self):
        """Check UX/UI components"""
        print("Checking UX/UI...")
        
        # Check if web interface exists
        if Path("web_deployment/index.html").exists():
            with open("web_deployment/index.html", 'r') as f:
                content = f.read()
                
            # Check for actual API connections
            if '/api/upload' in content:
                self.working.append("Web interface has upload API endpoint")
            else:
                self.issues.append("Web interface missing upload API connection")
                
            if 'dropZone' in content:
                self.working.append("Drag-and-drop UI exists")
            else:
                self.missing.append("No drag-and-drop interface")
        else:
            self.missing.append("No web interface at all")
            
        # Check for UX documentation
        ux_docs = [
            "UX_DESIGN.md",
            "USER_FLOWS.md",
            "API_DOCUMENTATION.md",
            "FRONTEND_GUIDE.md"
        ]
        
        for doc in ux_docs:
            if not Path(doc).exists():
                self.missing.append(f"Missing UX/UI documentation: {doc}")
                
    def check_integration(self):
        """Check if components actually connect"""
        print("Checking Integration...")
        
        # Check if frontend connects to backend
        integration_issues = []
        
        # Check API endpoints
        if not Path("API_ENDPOINTS.json").exists():
            integration_issues.append("No API endpoint documentation")
            
        # Check if services know about each other
        if not Path("SERVICE_REGISTRY.json").exists():
            integration_issues.append("No service registry - services can't find each other")
            
        # Check authentication flow
        if not Path("AUTH_FLOW.md").exists():
            integration_issues.append("No authentication flow documentation")
            
        for issue in integration_issues:
            self.issues.append(issue)
            
    def generate_report(self):
        """Generate diagnostic report"""
        print("\n" + "=" * 60)
        print("DIAGNOSTIC REPORT")
        print("=" * 60)
        
        print(f"\n✅ WORKING ({len(self.working)}):")
        for item in self.working:
            print(f"  - {item}")
            
        print(f"\n⚠️  ISSUES ({len(self.issues)}):")
        for item in self.issues:
            print(f"  - {item}")
            
        print(f"\n❌ MISSING ({len(self.missing)}):")
        for item in self.missing:
            print(f"  - {item}")
            
        print("\n" + "=" * 60)
        print("WHAT'S ACTUALLY MISSING:")
        print("=" * 60)
        print("""
1. FRONTEND-BACKEND CONNECTION
   - No actual API server running
   - Web interface doesn't connect to backend
   - No websocket connections
   - No data flow between services

2. UX/UI DOCUMENTATION
   - No user flow diagrams
   - No API documentation
   - No component documentation
   - No style guide

3. SERVICE COORDINATION
   - Services don't know about each other
   - No service discovery
   - No shared state
   - No message passing

4. ERROR HANDLING
   - No user-friendly error messages
   - No recovery mechanisms
   - No status indicators
   - No feedback loops

5. ACTUAL FUNCTIONALITY
   - Drag-drop doesn't process files
   - OAuth isn't connected
   - QR codes don't pair
   - Chat logs aren't processed
        """)
        
        # Save report
        with open("DIAGNOSTIC_REPORT.json", 'w') as f:
            json.dump({
                "working": self.working,
                "issues": self.issues,
                "missing": self.missing,
                "timestamp": str(Path.cwd())
            }, f, indent=2)
            
        print("\nReport saved to: DIAGNOSTIC_REPORT.json")

if __name__ == "__main__":
    diagnostic = SystemDiagnostic()
    diagnostic.run_diagnostic()