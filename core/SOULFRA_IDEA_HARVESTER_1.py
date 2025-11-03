#!/usr/bin/env python3
"""
SOULFRA IDEA HARVESTER
Scans the entire codebase for ideas, whispers, and intentions
Then builds them all out with visual monitoring
"""

import os
import re
import json
import sqlite3
import asyncio
import time
from pathlib import Path
from datetime import datetime
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser

class IdeaHarvester:
    """Harvests all ideas from the codebase"""
    
    def __init__(self):
        self.ideas = []
        self.whispers = []
        self.intentions = []
        self.components = []
        self.setup_database()
        
    def setup_database(self):
        """Setup harvest database"""
        self.db = sqlite3.connect('idea_harvest.db', check_same_thread=False)
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS harvested_ideas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_file TEXT,
                idea_text TEXT,
                idea_type TEXT,
                context TEXT,
                line_number INTEGER,
                emotional_tone TEXT,
                harvest_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                build_status TEXT DEFAULT 'pending',
                component_path TEXT
            )
        ''')
        self.db.commit()
        
    def harvest_codebase(self, root_path="."):
        """Scan entire codebase for ideas"""
        print("🌾 HARVESTING IDEAS FROM CODEBASE...")
        print("=" * 60)
        
        patterns = {
            'whisper': [
                r'whisper[^\'"]*[\'"]([^\'\"]+)[\'"]',
                r'WHISPER[^\'"]*[\'"]([^\'\"]+)[\'"]',
                r'idea\s*=\s*[\'"]([^\'\"]+)[\'"]',
                r'proposal.*[\'"]([^\'\"]+)[\'"]'
            ],
            'todo': [
                r'#\s*TODO:\s*(.+)',
                r'#\s*IDEA:\s*(.+)',
                r'#\s*BUILD:\s*(.+)',
                r'""".*?TODO:\s*(.+?)"""',
                r'""".*?IDEA:\s*(.+?)"""'
            ],
            'component': [
                r'class\s+(\w+).*:',
                r'def\s+create_(\w+)',
                r'build[_\s]+(\w+)',
                r'generate[_\s]+(\w+)'
            ],
            'feature': [
                r'feature.*[\'"]([^\'\"]+)[\'"]',
                r'functionality.*[\'"]([^\'\"]+)[\'"]',
                r'system.*[\'"]([^\'\"]+)[\'"]'
            ]
        }
        
        for file_path in Path(root_path).rglob("*"):
            if file_path.suffix in ['.py', '.js', '.md', '.json']:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        lines = content.split('\n')
                        
                    # Search for patterns
                    for pattern_type, pattern_list in patterns.items():
                        for pattern in pattern_list:
                            for match in re.finditer(pattern, content, re.MULTILINE | re.DOTALL):
                                idea = match.group(1).strip()
                                
                                # Find line number
                                line_num = content[:match.start()].count('\n') + 1
                                
                                # Get context
                                context_start = max(0, line_num - 3)
                                context_end = min(len(lines), line_num + 2)
                                context = '\n'.join(lines[context_start:context_end])
                                
                                # Detect tone
                                tone = self.detect_tone(idea)
                                
                                # Store in database
                                self.store_idea(
                                    source_file=str(file_path),
                                    idea_text=idea,
                                    idea_type=pattern_type,
                                    context=context,
                                    line_number=line_num,
                                    emotional_tone=tone
                                )
                                
                                print(f"  🌱 Found {pattern_type}: {idea[:50]}...")
                                
                except Exception as e:
                    # Skip files that can't be read
                    pass
                    
        # Get summary
        cursor = self.db.cursor()
        cursor.execute("SELECT COUNT(*) FROM harvested_ideas WHERE build_status = 'pending'")
        total = cursor.fetchone()[0]
        
        print(f"\n✨ HARVEST COMPLETE!")
        print(f"   Total ideas found: {total}")
        
        return total
        
    def detect_tone(self, text):
        """Detect emotional tone"""
        text_lower = text.lower()
        
        tones = {
            'playful': ['fun', 'game', 'play', 'joy', 'magic'],
            'analytical': ['analyze', 'track', 'monitor', 'measure'],
            'creative': ['create', 'build', 'make', 'design'],
            'protective': ['secure', 'safe', 'protect', 'guard'],
            'nurturing': ['help', 'support', 'care', 'guide'],
            'ambitious': ['platform', 'system', 'engine', 'framework']
        }
        
        for tone, keywords in tones.items():
            if any(keyword in text_lower for keyword in keywords):
                return tone
                
        return 'curious'
        
    def store_idea(self, **kwargs):
        """Store harvested idea"""
        cursor = self.db.cursor()
        cursor.execute('''
            INSERT INTO harvested_ideas 
            (source_file, idea_text, idea_type, context, line_number, emotional_tone)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            kwargs['source_file'],
            kwargs['idea_text'],
            kwargs['idea_type'],
            kwargs['context'],
            kwargs['line_number'],
            kwargs['emotional_tone']
        ))
        self.db.commit()

class BuildOrchestrator:
    """Orchestrates building all harvested ideas"""
    
    def __init__(self, harvester):
        self.harvester = harvester
        self.build_queue = []
        self.active_builds = {}
        self.completed_builds = []
        self.monitoring_data = {
            'total_ideas': 0,
            'building': 0,
            'completed': 0,
            'failed': 0,
            'current_build': None,
            'build_log': []
        }
        
    def prepare_build_queue(self):
        """Prepare queue of ideas to build"""
        cursor = self.harvester.db.cursor()
        cursor.execute('''
            SELECT id, idea_text, idea_type, emotional_tone 
            FROM harvested_ideas 
            WHERE build_status = 'pending'
            ORDER BY 
                CASE idea_type 
                    WHEN 'component' THEN 1 
                    WHEN 'feature' THEN 2 
                    WHEN 'whisper' THEN 3 
                    ELSE 4 
                END
        ''')
        
        self.build_queue = cursor.fetchall()
        self.monitoring_data['total_ideas'] = len(self.build_queue)
        
        print(f"\n🏗️ BUILD QUEUE PREPARED")
        print(f"   Ideas to build: {len(self.build_queue)}")
        
    async def build_all(self):
        """Build all ideas with visual monitoring"""
        print("\n🔨 STARTING BUILD ORCHESTRATION...")
        print("=" * 60)
        
        # Import the simplified builder
        from SIMPLE_MAXED_DEMO import SimplifiedMaxedSystem
        builder = SimplifiedMaxedSystem()
        
        for idx, (idea_id, idea_text, idea_type, tone) in enumerate(self.build_queue):
            self.monitoring_data['current_build'] = {
                'id': idea_id,
                'idea': idea_text,
                'type': idea_type,
                'tone': tone,
                'progress': 0,
                'status': 'starting'
            }
            self.monitoring_data['building'] += 1
            
            print(f"\n[{idx+1}/{len(self.build_queue)}] Building: {idea_text[:60]}...")
            
            try:
                # Simulate build stages
                stages = [
                    ('decomposing', 0.2),
                    ('calculating_cost', 0.4),
                    ('routing', 0.6),
                    ('generating_docs', 0.8),
                    ('building_code', 1.0)
                ]
                
                for stage, progress in stages:
                    self.monitoring_data['current_build']['status'] = stage
                    self.monitoring_data['current_build']['progress'] = progress
                    await asyncio.sleep(0.5)  # Simulate work
                
                # Actually build it
                if idea_type in ['whisper', 'feature', 'component']:
                    component_path = builder.build_component(idea_text, [
                        {'name': 'Core', 'type': 'core'}
                    ])
                    
                    # Update database
                    cursor = self.harvester.db.cursor()
                    cursor.execute('''
                        UPDATE harvested_ideas 
                        SET build_status = 'completed', component_path = ?
                        WHERE id = ?
                    ''', (component_path, idea_id))
                    self.harvester.db.commit()
                    
                    self.monitoring_data['completed'] += 1
                    self.monitoring_data['build_log'].append({
                        'time': datetime.now().isoformat(),
                        'idea': idea_text,
                        'status': 'success',
                        'path': component_path
                    })
                    
                    print(f"  ✅ Built: {component_path}")
                else:
                    print(f"  ⏭️  Skipped (type: {idea_type})")
                    
            except Exception as e:
                self.monitoring_data['failed'] += 1
                self.monitoring_data['build_log'].append({
                    'time': datetime.now().isoformat(),
                    'idea': idea_text,
                    'status': 'failed',
                    'error': str(e)
                })
                print(f"  ❌ Failed: {e}")
                
            self.monitoring_data['building'] -= 1
            
        print("\n✨ BUILD ORCHESTRATION COMPLETE!")
        print(f"   Completed: {self.monitoring_data['completed']}")
        print(f"   Failed: {self.monitoring_data['failed']}")

class VisualMonitor:
    """Web-based visual monitoring dashboard"""
    
    def __init__(self, orchestrator):
        self.orchestrator = orchestrator
        self.port = 8888
        
    def create_dashboard(self):
        """Create monitoring dashboard HTML"""
        html = '''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Build Monitor</title>
    <style>
        body {
            font-family: monospace;
            background: #000;
            color: #0f0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border: 2px solid #0f0;
            padding: 20px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-box {
            border: 1px solid #0f0;
            padding: 15px;
            text-align: center;
        }
        .stat-value {
            font-size: 36px;
            margin: 10px 0;
        }
        .current-build {
            border: 2px solid #ff0;
            padding: 20px;
            margin-bottom: 30px;
            min-height: 150px;
        }
        .progress-bar {
            width: 100%;
            height: 30px;
            background: #333;
            margin: 20px 0;
            position: relative;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #0f0, #ff0);
            transition: width 0.5s ease;
        }
        .build-log {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #0f0;
            padding: 15px;
            background: #111;
        }
        .log-entry {
            margin: 5px 0;
            padding: 5px;
        }
        .success { color: #0f0; }
        .failed { color: #f00; }
        .emoji { font-size: 24px; margin-right: 10px; }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .building {
            animation: pulse 1s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="emoji">🌟</span>SOULFRA BUILD MONITOR<span class="emoji">🌟</span></h1>
            <p>Watching whispers become code in real-time</p>
        </div>
        
        <div class="stats">
            <div class="stat-box">
                <div>Total Ideas</div>
                <div class="stat-value" id="total">0</div>
            </div>
            <div class="stat-box building">
                <div>Building</div>
                <div class="stat-value" id="building">0</div>
            </div>
            <div class="stat-box success">
                <div>Completed</div>
                <div class="stat-value" id="completed">0</div>
            </div>
            <div class="stat-box failed">
                <div>Failed</div>
                <div class="stat-value" id="failed">0</div>
            </div>
        </div>
        
        <div class="current-build">
            <h2>Current Build</h2>
            <div id="current-info">Waiting for builds...</div>
            <div class="progress-bar">
                <div class="progress-fill" id="progress" style="width: 0%"></div>
            </div>
            <div id="current-status"></div>
        </div>
        
        <div class="build-log">
            <h2>Build Log</h2>
            <div id="log"></div>
        </div>
    </div>
    
    <script>
        async function updateStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                
                // Update stats
                document.getElementById('total').textContent = data.total_ideas;
                document.getElementById('building').textContent = data.building;
                document.getElementById('completed').textContent = data.completed;
                document.getElementById('failed').textContent = data.failed;
                
                // Update current build
                if (data.current_build) {
                    const build = data.current_build;
                    document.getElementById('current-info').innerHTML = 
                        `<strong>${build.idea}</strong><br>
                         Type: ${build.type} | Tone: ${build.tone}`;
                    document.getElementById('progress').style.width = 
                        (build.progress * 100) + '%';
                    document.getElementById('current-status').textContent = 
                        `Status: ${build.status}`;
                }
                
                // Update log
                const logDiv = document.getElementById('log');
                logDiv.innerHTML = '';
                data.build_log.slice(-20).reverse().forEach(entry => {
                    const div = document.createElement('div');
                    div.className = 'log-entry ' + entry.status;
                    div.innerHTML = `[${entry.time.split('T')[1].split('.')[0]}] 
                        ${entry.status === 'success' ? '✅' : '❌'} 
                        ${entry.idea.substring(0, 60)}...
                        ${entry.path ? ' → ' + entry.path : ''}`;
                    logDiv.appendChild(div);
                });
                
            } catch (error) {
                console.error('Update failed:', error);
            }
        }
        
        // Update every 500ms
        setInterval(updateStatus, 500);
        updateStatus();
    </script>
</body>
</html>'''
        
        with open('monitor.html', 'w') as f:
            f.write(html)
            
    def start_server(self):
        """Start monitoring server"""
        class MonitorHandler(SimpleHTTPRequestHandler):
            orchestrator = self.orchestrator
            
            def do_GET(self):
                if self.path == '/api/status':
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    
                    status = json.dumps(self.orchestrator.monitoring_data)
                    self.wfile.write(status.encode())
                elif self.path == '/' or self.path == '/monitor.html':
                    self.path = '/monitor.html'
                    super().do_GET()
                else:
                    super().do_GET()
                    
            def log_message(self, format, *args):
                pass  # Suppress logs
        
        self.create_dashboard()
        
        server = HTTPServer(('localhost', self.port), MonitorHandler)
        thread = threading.Thread(target=server.serve_forever)
        thread.daemon = True
        thread.start()
        
        print(f"\n🌐 Monitor running at: http://localhost:{self.port}")
        webbrowser.open(f'http://localhost:{self.port}')

async def main():
    """Main orchestration"""
    print("✨ SOULFRA IDEA HARVESTER & BUILD ORCHESTRATOR ✨")
    print("=" * 60)
    
    # Step 1: Harvest ideas
    harvester = IdeaHarvester()
    total = harvester.harvest_codebase("..")  # Scan parent directory
    
    if total == 0:
        print("\nNo new ideas found to build.")
        return
        
    # Step 2: Prepare build queue
    orchestrator = BuildOrchestrator(harvester)
    orchestrator.prepare_build_queue()
    
    # Step 3: Start visual monitor
    monitor = VisualMonitor(orchestrator)
    monitor.start_server()
    
    print("\n📺 Open your browser to watch the builds happen!")
    print("   Builds will start in 3 seconds...")
    await asyncio.sleep(3)
    
    # Step 4: Build everything
    await orchestrator.build_all()
    
    print("\n✅ All builds complete!")
    print("   Monitor will stay open. Press Ctrl+C to exit.")
    
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n\n✨ Build session ended.")

if __name__ == "__main__":
    # Create the launcher script
    launcher = '''#!/bin/bash
echo "🚀 LAUNCHING SOULFRA IDEA HARVESTER & BUILD ORCHESTRATOR"
echo ""
echo "This will:"
echo "  1. Scan your entire codebase for ideas"
echo "  2. Extract all whispers, TODOs, and component ideas"
echo "  3. Build them all automatically"
echo "  4. Show real-time progress in your browser"
echo ""
echo "Press Enter to start or Ctrl+C to cancel..."
read

python3 SOULFRA_IDEA_HARVESTER.py
'''
    
    with open('HARVEST_AND_BUILD.sh', 'w') as f:
        f.write(launcher)
    os.chmod('HARVEST_AND_BUILD.sh', 0o755)
    
    print("Created HARVEST_AND_BUILD.sh")
    print("\nTo watch it harvest ideas and build them:")
    print("  ./HARVEST_AND_BUILD.sh")
    
    # Run it
    asyncio.run(main())