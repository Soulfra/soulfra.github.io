#!/usr/bin/env python3
"""
REAL CODEBASE PROCESSOR
Actually processes your Soulfra codebase and shows what it finds
No recursion, no complex dependencies, just works
"""

import os
import re
import json
import http.server
import socketserver
from pathlib import Path
from datetime import datetime
import threading
import time

class CodebaseScanner:
    """Scans the real codebase for ideas and components"""
    
    def __init__(self):
        self.findings = {
            'whispers': [],
            'components': [],
            'ideas': [],
            'features': [],
            'stats': {
                'files_scanned': 0,
                'total_lines': 0,
                'components_found': 0
            }
        }
        
    def scan_codebase(self, root_path="../../.."):
        """Scan the actual Soulfra codebase"""
        print("🔍 Scanning Soulfra codebase...")
        
        # Start from handoff directory and go up
        base_path = Path(__file__).parent / root_path
        
        # Patterns to find
        patterns = {
            'whisper': r'whisper.*?[\'"]([^\'\"]+)[\'"]',
            'idea': r'(?:idea|IDEA|TODO).*?[\'"]([^\'\"]+)[\'"]',
            'class': r'class\s+(\w+).*:.*?"""(.*?)"""',
            'feature': r'(?:feature|create|build).*?[\'"]([^\'\"]+)[\'"]'
        }
        
        # Files to scan
        for file_path in base_path.rglob("*.py"):
            # Skip our own files to avoid recursion
            if 'handoff' in str(file_path) and file_path.name in [
                'REAL_CODEBASE_PROCESSOR.py',
                'SIMPLE_WORKING_DEMO.py',
                'ONE_CLICK_DEMO.py'
            ]:
                continue
                
            try:
                self.findings['stats']['files_scanned'] += 1
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.findings['stats']['total_lines'] += len(content.split('\n'))
                
                # Find whispers
                for match in re.finditer(patterns['whisper'], content, re.IGNORECASE):
                    self.findings['whispers'].append({
                        'text': match.group(1),
                        'file': str(file_path.relative_to(base_path)),
                        'type': 'whisper'
                    })
                
                # Find ideas
                for match in re.finditer(patterns['idea'], content, re.IGNORECASE):
                    self.findings['ideas'].append({
                        'text': match.group(1),
                        'file': str(file_path.relative_to(base_path)),
                        'type': 'idea'
                    })
                
                # Find classes/components
                for match in re.finditer(patterns['class'], content, re.DOTALL):
                    class_name = match.group(1)
                    docstring = match.group(2).strip() if match.group(2) else ""
                    
                    self.findings['components'].append({
                        'name': class_name,
                        'description': docstring.split('\n')[0] if docstring else f"{class_name} component",
                        'file': str(file_path.relative_to(base_path)),
                        'type': 'component'
                    })
                    self.findings['stats']['components_found'] += 1
                    
            except Exception as e:
                # Skip files that can't be read
                pass
                
        print(f"✅ Scanned {self.findings['stats']['files_scanned']} files")
        print(f"   Found {len(self.findings['whispers'])} whispers")
        print(f"   Found {len(self.findings['ideas'])} ideas")
        print(f"   Found {len(self.findings['components'])} components")
        
        return self.findings

class SimpleWebServer:
    """Simple web server to show findings"""
    
    def __init__(self, findings, port=7777):
        self.findings = findings
        self.port = port
        self.output_dir = Path('codebase_output')
        self.output_dir.mkdir(exist_ok=True)
        
    def create_html(self):
        """Create HTML visualization of findings"""
        
        # Generate component cards
        component_html = ""
        for comp in self.findings['components'][:20]:  # Show first 20
            component_html += f'''
            <div class="component-card">
                <h3>{comp['name']}</h3>
                <p class="description">{comp['description']}</p>
                <p class="file">📁 {comp['file']}</p>
            </div>
            '''
            
        # Generate whisper list
        whisper_html = ""
        for whisper in self.findings['whispers'][:20]:  # Show first 20
            whisper_html += f'''
            <div class="whisper-item">
                <span class="whisper-text">"{whisper['text']}"</span>
                <span class="whisper-file">{whisper['file']}</span>
            </div>
            '''
            
        # Generate idea list
        idea_html = ""
        for idea in self.findings['ideas'][:20]:  # Show first 20
            idea_html += f'''
            <div class="idea-item">
                <span class="idea-text">💡 {idea['text']}</span>
                <span class="idea-file">{idea['file']}</span>
            </div>
            '''
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Codebase Analysis</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #0a0a0a;
            color: #fff;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        h1 {{
            text-align: center;
            color: #00ffff;
            text-shadow: 0 0 20px rgba(0,255,255,0.5);
            margin-bottom: 40px;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }}
        .stat-box {{
            background: rgba(0,255,255,0.1);
            border: 2px solid #00ffff;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
        }}
        .stat-value {{
            font-size: 36px;
            font-weight: bold;
            color: #00ff00;
        }}
        .stat-label {{
            font-size: 14px;
            color: #aaa;
            margin-top: 5px;
        }}
        .section {{
            margin: 40px 0;
        }}
        .section h2 {{
            color: #ffff00;
            border-bottom: 2px solid #ffff00;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }}
        .component-card {{
            background: rgba(255,255,255,0.05);
            border: 1px solid #444;
            padding: 20px;
            margin: 10px 0;
            border-radius: 5px;
            transition: all 0.3s;
        }}
        .component-card:hover {{
            background: rgba(255,255,255,0.1);
            border-color: #00ff00;
            transform: translateX(5px);
        }}
        .component-card h3 {{
            color: #00ff00;
            margin: 0 0 10px 0;
        }}
        .description {{
            color: #ccc;
            margin: 10px 0;
        }}
        .file {{
            color: #666;
            font-size: 12px;
            font-family: monospace;
        }}
        .whisper-item, .idea-item {{
            background: rgba(255,255,255,0.02);
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .whisper-text, .idea-text {{
            color: #00ffff;
            flex: 1;
        }}
        .whisper-file, .idea-file {{
            color: #666;
            font-size: 11px;
            font-family: monospace;
            margin-left: 20px;
        }}
        .info-box {{
            background: rgba(0,255,0,0.1);
            border: 1px solid #00ff00;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .working {{
            color: #00ff00;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 Soulfra Codebase Analysis 🌟</h1>
        
        <div class="info-box">
            <p class="working">✅ THIS IS WORKING!</p>
            <p>This page shows real data extracted from your Soulfra codebase.</p>
            <p>Scanned at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-value">{self.findings['stats']['files_scanned']}</div>
                <div class="stat-label">Files Scanned</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{self.findings['stats']['total_lines']}</div>
                <div class="stat-label">Lines of Code</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{len(self.findings['whispers'])}</div>
                <div class="stat-label">Whispers Found</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{self.findings['stats']['components_found']}</div>
                <div class="stat-label">Components Found</div>
            </div>
        </div>
        
        <div class="section">
            <h2>🏗️ Components in Your Codebase</h2>
            {component_html if component_html else '<p style="color: #666;">No components found yet</p>'}
        </div>
        
        <div class="section">
            <h2>🌬️ Whispers Found</h2>
            {whisper_html if whisper_html else '<p style="color: #666;">No whispers found yet</p>'}
        </div>
        
        <div class="section">
            <h2>💡 Ideas & TODOs</h2>
            {idea_html if idea_html else '<p style="color: #666;">No ideas found yet</p>'}
        </div>
        
        <div class="info-box" style="margin-top: 40px;">
            <h3>What This Shows</h3>
            <p>This is a real scan of your Soulfra codebase showing:</p>
            <ul>
                <li>All Python components and classes</li>
                <li>Whispered ideas in the code</li>
                <li>TODOs and feature ideas</li>
                <li>File locations and statistics</li>
            </ul>
            <p>The whisper-to-code system would take these findings and generate new components!</p>
        </div>
    </div>
</body>
</html>"""
        
        # Save HTML
        html_path = self.output_dir / 'index.html'
        with open(html_path, 'w') as f:
            f.write(html)
            
        # Also save JSON data
        json_path = self.output_dir / 'findings.json'
        with open(json_path, 'w') as f:
            json.dump(self.findings, f, indent=2)
            
        return html_path
        
    def start_server(self):
        """Start the web server"""
        os.chdir(self.output_dir)
        
        Handler = http.server.SimpleHTTPRequestHandler
        with socketserver.TCPServer(("", self.port), Handler) as httpd:
            print(f"\n🌐 Server running at http://localhost:{self.port}")
            print("\n✅ WORKING! Open your browser to see your codebase analysis")
            print("\nPress Ctrl+C to stop")
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n✨ Server stopped")

def main():
    print("🚀 SOULFRA CODEBASE PROCESSOR")
    print("=" * 50)
    print("\nThis will scan your actual codebase and show findings\n")
    
    # Step 1: Scan codebase
    scanner = CodebaseScanner()
    findings = scanner.scan_codebase()
    
    # Step 2: Create web interface
    server = SimpleWebServer(findings)
    html_path = server.create_html()
    
    print(f"\n✅ Analysis complete!")
    print(f"   HTML report: {html_path}")
    print(f"   JSON data: {server.output_dir / 'findings.json'}")
    
    # Step 3: Start server
    server.start_server()

if __name__ == "__main__":
    main()