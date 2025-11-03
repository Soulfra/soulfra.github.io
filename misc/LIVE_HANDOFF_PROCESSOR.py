#!/usr/bin/env python3
"""
LIVE HANDOFF PROCESSOR
Watches for new handoffs, chatlogs, and inputs
Automatically processes them through the AI economy
Updates its own codebase with generated components
"""

import os
import json
import sqlite3
import asyncio
import hashlib
from datetime import datetime
from pathlib import Path
import watchdog.observers
import watchdog.events
import re
import shutil
from typing import Dict, List, Optional
import subprocess

class LiveHandoffProcessor:
    """Monitors for new inputs and processes them automatically"""
    
    def __init__(self):
        self.setup_directories()
        self.setup_database()
        self.ai_economy = None
        self.active_watchers = {}
        self.processing_queue = asyncio.Queue()
        
    def setup_directories(self):
        """Create input/output directory structure"""
        self.dirs = {
            'inbox': Path('live_handoff/inbox'),
            'processing': Path('live_handoff/processing'),
            'completed': Path('live_handoff/completed'),
            'generated': Path('live_handoff/generated_components'),
            'integrated': Path('live_handoff/integrated_codebase'),
            'logs': Path('live_handoff/logs')
        }
        
        for dir_path in self.dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)
            
        # Create README for inbox
        readme = self.dirs['inbox'] / 'README.md'
        if not readme.exists():
            readme.write_text('''# 📥 HANDOFF INBOX

Drop files here to be processed:
- `.md` files with ideas or documentation
- `.txt` or `.log` files with chat logs
- `.json` files with structured data
- Any text file with ideas, whispers, or requirements

The system will automatically:
1. Detect new files
2. Extract ideas and whispers
3. Post them to the AI economy
4. Generate components
5. Integrate into the codebase
''')
            
    def setup_database(self):
        """Setup tracking database"""
        self.db = sqlite3.connect('live_handoff.db', check_same_thread=False)
        
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS handoff_tracking (
                handoff_id TEXT PRIMARY KEY,
                file_name TEXT,
                file_type TEXT,
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                ideas_extracted INTEGER DEFAULT 0,
                components_generated INTEGER DEFAULT 0,
                integration_status TEXT,
                processed_at TIMESTAMP
            )
        ''')
        
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS extracted_ideas (
                idea_id TEXT PRIMARY KEY,
                handoff_id TEXT,
                idea_text TEXT,
                idea_type TEXT,
                confidence REAL,
                whisper_id TEXT,
                component_id TEXT,
                extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS codebase_modifications (
                modification_id TEXT PRIMARY KEY,
                component_id TEXT,
                file_path TEXT,
                modification_type TEXT,
                old_content TEXT,
                new_content TEXT,
                modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                agent_id TEXT
            )
        ''')
        
        self.db.commit()

class HandoffFileHandler(watchdog.events.FileSystemEventHandler):
    """Handles new files dropped in inbox"""
    
    def __init__(self, processor):
        self.processor = processor
        
    def on_created(self, event):
        if not event.is_directory:
            asyncio.run(self.processor.handle_new_file(event.src_path))
            
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(('.md', '.txt', '.log', '.json')):
            asyncio.run(self.processor.handle_new_file(event.src_path))

class IdeaExtractor:
    """Extracts ideas from various file formats"""
    
    def extract_from_file(self, file_path: Path) -> List[Dict]:
        """Extract ideas based on file type"""
        ideas = []
        
        try:
            content = file_path.read_text(encoding='utf-8')
            
            if file_path.suffix == '.md':
                ideas.extend(self.extract_from_markdown(content))
            elif file_path.suffix in ['.txt', '.log']:
                ideas.extend(self.extract_from_chatlog(content))
            elif file_path.suffix == '.json':
                ideas.extend(self.extract_from_json(content))
            else:
                ideas.extend(self.extract_generic(content))
                
        except Exception as e:
            print(f"Error extracting from {file_path}: {e}")
            
        return ideas
        
    def extract_from_markdown(self, content: str) -> List[Dict]:
        """Extract ideas from markdown files"""
        ideas = []
        
        # Look for specific patterns
        patterns = [
            (r'(?:TODO|IDEA|BUILD|CREATE):\s*(.+)', 'todo'),
            (r'whisper[:\s]+["\']?([^"\'\n]+)["\']?', 'whisper'),
            (r'(?:build|create|make|generate)\s+(?:a|an)?\s*([^.\n]+)', 'command'),
            (r'##\s*(?:Feature|Component|Idea):\s*(.+)', 'feature'),
            (r'- \[ \]\s*(.+)', 'task')
        ]
        
        for pattern, idea_type in patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE):
                idea_text = match.group(1).strip()
                if len(idea_text) > 10:  # Filter out too short
                    ideas.append({
                        'text': idea_text,
                        'type': idea_type,
                        'confidence': 0.8
                    })
                    
        return ideas
        
    def extract_from_chatlog(self, content: str) -> List[Dict]:
        """Extract ideas from chat logs"""
        ideas = []
        
        # Common chat patterns
        lines = content.split('\n')
        
        for line in lines:
            # Look for user requests
            if any(keyword in line.lower() for keyword in ['can you', 'please', 'build', 'create', 'make']):
                # Extract the request
                request_match = re.search(r'(?:can you|please|could you)\s+(.+?)[\?\.]?$', line, re.IGNORECASE)
                if request_match:
                    ideas.append({
                        'text': request_match.group(1).strip(),
                        'type': 'request',
                        'confidence': 0.7
                    })
                    
            # Look for ideas mentioned
            idea_match = re.search(r'(?:idea|thought|what if).*?[:\s]+(.+?)[\.\?]', line, re.IGNORECASE)
            if idea_match:
                ideas.append({
                    'text': idea_match.group(1).strip(),
                    'type': 'idea',
                    'confidence': 0.6
                })
                
        return ideas
        
    def extract_from_json(self, content: str) -> List[Dict]:
        """Extract from structured JSON"""
        ideas = []
        
        try:
            data = json.loads(content)
            
            # Handle different JSON structures
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, str):
                        ideas.append({
                            'text': item,
                            'type': 'structured',
                            'confidence': 0.9
                        })
                    elif isinstance(item, dict):
                        if 'idea' in item:
                            ideas.append({
                                'text': item['idea'],
                                'type': 'structured',
                                'confidence': 0.9
                            })
                        elif 'whisper' in item:
                            ideas.append({
                                'text': item['whisper'],
                                'type': 'whisper',
                                'confidence': 0.95
                            })
                            
            elif isinstance(data, dict):
                # Look for idea-like keys
                for key in ['ideas', 'whispers', 'features', 'components', 'todos']:
                    if key in data:
                        items = data[key] if isinstance(data[key], list) else [data[key]]
                        for item in items:
                            ideas.append({
                                'text': str(item),
                                'type': key.rstrip('s'),
                                'confidence': 0.85
                            })
                            
        except json.JSONDecodeError:
            pass
            
        return ideas
        
    def extract_generic(self, content: str) -> List[Dict]:
        """Generic extraction for any text"""
        ideas = []
        
        # Split into sentences and look for actionable items
        sentences = re.split(r'[.!?]+', content)
        
        action_words = ['create', 'build', 'make', 'develop', 'implement', 'add', 'generate']
        
        for sentence in sentences:
            sentence = sentence.strip()
            if any(word in sentence.lower() for word in action_words):
                if 20 < len(sentence) < 200:  # Reasonable length
                    ideas.append({
                        'text': sentence,
                        'type': 'generic',
                        'confidence': 0.5
                    })
                    
        return ideas

class CodebaseIntegrator:
    """Integrates generated components into the codebase"""
    
    def __init__(self, processor):
        self.processor = processor
        self.integration_root = processor.dirs['integrated']
        
    async def integrate_component(self, component_path: Path, metadata: Dict) -> bool:
        """Integrate a component into the live codebase"""
        try:
            # Determine integration location
            component_name = component_path.stem
            component_type = self.classify_component(component_name, metadata)
            
            # Create appropriate directory structure
            if component_type == 'ui':
                target_dir = self.integration_root / 'ui_components'
            elif component_type == 'data':
                target_dir = self.integration_root / 'data_processors'
            elif component_type == 'api':
                target_dir = self.integration_root / 'api_handlers'
            else:
                target_dir = self.integration_root / 'core_components'
                
            target_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy component
            target_path = target_dir / component_path.name
            shutil.copy2(component_path, target_path)
            
            # Create __init__.py for imports
            init_file = target_dir / '__init__.py'
            if not init_file.exists():
                init_file.write_text('# Auto-generated package file\n')
                
            # Add to __init__.py
            with open(init_file, 'a') as f:
                f.write(f"from .{component_name} import *\n")
                
            # Create integration manifest
            manifest = {
                'component': component_name,
                'integrated_at': datetime.now().isoformat(),
                'location': str(target_path),
                'type': component_type,
                'source': metadata
            }
            
            manifest_path = target_dir / f"{component_name}.manifest.json"
            with open(manifest_path, 'w') as f:
                json.dump(manifest, f, indent=2)
                
            # Update main launcher if needed
            await self.update_main_launcher(component_name, target_path)
            
            return True
            
        except Exception as e:
            print(f"Integration error: {e}")
            return False
            
    def classify_component(self, name: str, metadata: Dict) -> str:
        """Classify component type"""
        name_lower = name.lower()
        
        if any(word in name_lower for word in ['ui', 'display', 'visual', 'interface']):
            return 'ui'
        elif any(word in name_lower for word in ['data', 'store', 'database', 'cache']):
            return 'data'
        elif any(word in name_lower for word in ['api', 'endpoint', 'route', 'handler']):
            return 'api'
        else:
            return 'core'
            
    async def update_main_launcher(self, component_name: str, component_path: Path):
        """Update main launcher to include new component"""
        launcher_path = self.integration_root / 'INTEGRATED_LAUNCHER.py'
        
        if not launcher_path.exists():
            # Create initial launcher
            launcher_content = '''#!/usr/bin/env python3
"""
INTEGRATED LAUNCHER
Auto-updated with new components
"""

import sys
from pathlib import Path

# Add component directories to path
component_dirs = [
    'core_components',
    'ui_components',
    'data_processors',
    'api_handlers'
]

for dir_name in component_dirs:
    sys.path.append(str(Path(__file__).parent / dir_name))

# Available components
components = {}

def register_component(name, module):
    """Register a component for use"""
    components[name] = module

def list_components():
    """List all available components"""
    print("\\n🌟 Available Components:")
    for name in sorted(components.keys()):
        print(f"  - {name}")

def test_component(name):
    """Test a specific component"""
    if name in components:
        print(f"\\n🧪 Testing {name}...")
        module = components[name]
        # Run test if available
        if hasattr(module, 'test'):
            module.test()
        else:
            print("No test method found")
    else:
        print(f"Component '{name}' not found")

# Auto-generated component imports
'''
            launcher_path.write_text(launcher_content)
            os.chmod(launcher_path, 0o755)
            
        # Add new component import
        with open(launcher_path, 'a') as f:
            f.write(f"\n# {datetime.now().isoformat()}")
            f.write(f"\ntry:")
            f.write(f"\n    from {component_path.parent.name}.{component_name} import {component_name}")
            f.write(f"\n    register_component('{component_name}', {component_name})")
            f.write(f"\nexcept ImportError as e:")
            f.write(f"\n    print(f'Failed to import {component_name}: {{e}}')")
            f.write(f"\n")

class LiveHandoffSystem:
    """Complete live handoff processing system"""
    
    def __init__(self):
        self.processor = LiveHandoffProcessor()
        self.extractor = IdeaExtractor()
        self.integrator = CodebaseIntegrator(self.processor)
        self.file_handler = HandoffFileHandler(self)
        self.observer = watchdog.observers.Observer()
        
    async def start(self):
        """Start the live processing system"""
        print("🚀 LIVE HANDOFF PROCESSOR STARTING...")
        print("=" * 60)
        
        # Start file watcher
        self.observer.schedule(
            self.file_handler,
            str(self.processor.dirs['inbox']),
            recursive=False
        )
        self.observer.start()
        
        print(f"\n📥 Watching inbox: {self.processor.dirs['inbox']}")
        print("\nDrop files to process:")
        print("  - Markdown files with ideas")
        print("  - Chat logs with requests")
        print("  - JSON files with structured data")
        print("\n✨ Components will be generated and integrated automatically!")
        
        # Start AI economy connection
        await self.connect_to_ai_economy()
        
        # Process any existing files
        await self.process_existing_files()
        
        # Start processing loop
        await self.processing_loop()
        
    async def handle_new_file(self, file_path: str):
        """Handle a new file dropped in inbox"""
        file_path = Path(file_path)
        
        if file_path.name.startswith('.') or file_path.name == 'README.md':
            return
            
        print(f"\n📄 New file detected: {file_path.name}")
        
        # Create handoff record
        handoff_id = hashlib.md5(f"{file_path.name}{datetime.now()}".encode()).hexdigest()[:8]
        
        cursor = self.processor.db.cursor()
        cursor.execute('''
            INSERT INTO handoff_tracking (handoff_id, file_name, file_type)
            VALUES (?, ?, ?)
        ''', (handoff_id, file_path.name, file_path.suffix))
        self.processor.db.commit()
        
        # Move to processing
        processing_path = self.processor.dirs['processing'] / file_path.name
        shutil.move(str(file_path), str(processing_path))
        
        # Extract ideas
        ideas = self.extractor.extract_from_file(processing_path)
        print(f"  📊 Extracted {len(ideas)} ideas")
        
        # Store extracted ideas
        for idea in ideas:
            idea_id = hashlib.md5(f"{idea['text']}{datetime.now()}".encode()).hexdigest()[:8]
            
            cursor.execute('''
                INSERT INTO extracted_ideas 
                (idea_id, handoff_id, idea_text, idea_type, confidence)
                VALUES (?, ?, ?, ?, ?)
            ''', (idea_id, handoff_id, idea['text'], idea['type'], idea['confidence']))
            
        self.processor.db.commit()
        
        # Update tracking
        cursor.execute('''
            UPDATE handoff_tracking 
            SET status = 'processing', ideas_extracted = ?
            WHERE handoff_id = ?
        ''', (len(ideas), handoff_id))
        self.processor.db.commit()
        
        # Queue for AI economy processing
        await self.processor.processing_queue.put({
            'handoff_id': handoff_id,
            'file_path': processing_path,
            'ideas': ideas
        })
        
    async def connect_to_ai_economy(self):
        """Connect to the AI economy system"""
        try:
            # Import AI economy
            from AI_ECONOMY_INTEGRATION import AIEconomyEngine
            self.processor.ai_economy = AIEconomyEngine()
            print("✅ Connected to AI Economy")
        except ImportError:
            print("⚠️  AI Economy not available, using direct generation")
            self.processor.ai_economy = None
            
    async def process_existing_files(self):
        """Process any files already in inbox"""
        inbox_files = list(self.processor.dirs['inbox'].glob('*'))
        
        for file_path in inbox_files:
            if not file_path.name.startswith('.') and file_path.name != 'README.md':
                await self.handle_new_file(str(file_path))
                
    async def processing_loop(self):
        """Main processing loop"""
        while True:
            try:
                # Get next item to process
                item = await asyncio.wait_for(
                    self.processor.processing_queue.get(),
                    timeout=5.0
                )
                
                await self.process_handoff(item)
                
            except asyncio.TimeoutError:
                # No items, check AI economy
                if self.processor.ai_economy:
                    # Run an economy cycle
                    await self.run_economy_cycle()
                    
            except Exception as e:
                print(f"Processing error: {e}")
                
    async def process_handoff(self, item: Dict):
        """Process a handoff through the system"""
        handoff_id = item['handoff_id']
        ideas = item['ideas']
        
        print(f"\n🔄 Processing handoff {handoff_id}")
        
        components_generated = 0
        
        if self.processor.ai_economy:
            # Post ideas as whispers to AI economy
            for idea in ideas:
                if idea['confidence'] > 0.6:
                    # Create whisper in AI economy
                    whisper_id = await self.post_to_economy(idea['text'])
                    
                    # Update idea record
                    cursor = self.processor.db.cursor()
                    cursor.execute('''
                        UPDATE extracted_ideas 
                        SET whisper_id = ?
                        WHERE idea_text = ? AND handoff_id = ?
                    ''', (whisper_id, idea['text'], handoff_id))
                    self.processor.db.commit()
                    
            # Let economy process
            results = await self.processor.ai_economy.run_economy_cycle()
            components_generated = results.get('components_created', 0)
            
        else:
            # Direct generation
            from SIMPLE_MAXED_DEMO import SimplifiedMaxedSystem
            system = SimplifiedMaxedSystem()
            
            for idea in ideas:
                if idea['confidence'] > 0.6:
                    try:
                        component_path = system.build_component(idea['text'], [])
                        
                        # Integrate component
                        success = await self.integrator.integrate_component(
                            Path(component_path),
                            {'source': 'handoff', 'idea': idea}
                        )
                        
                        if success:
                            components_generated += 1
                            
                    except Exception as e:
                        print(f"  ❌ Failed to generate: {e}")
                        
        # Move to completed
        processing_path = item['file_path']
        completed_path = self.processor.dirs['completed'] / processing_path.name
        shutil.move(str(processing_path), str(completed_path))
        
        # Update tracking
        cursor = self.processor.db.cursor()
        cursor.execute('''
            UPDATE handoff_tracking 
            SET status = 'completed', 
                components_generated = ?,
                integration_status = 'integrated',
                processed_at = CURRENT_TIMESTAMP
            WHERE handoff_id = ?
        ''', (components_generated, handoff_id))
        self.processor.db.commit()
        
        print(f"  ✅ Generated {components_generated} components")
        
    async def post_to_economy(self, idea_text: str) -> str:
        """Post idea as whisper to AI economy"""
        # Determine bounty based on idea quality
        bounty = 100.0  # Base bounty
        
        # Post to whisper market
        cursor = self.processor.ai_economy.db.cursor()
        whisper_id = hashlib.md5(f"{idea_text}{datetime.now()}".encode()).hexdigest()[:8]
        
        cursor.execute('''
            INSERT INTO whisper_market 
            (whisper_id, whisper_text, bounty, posted_by_agent)
            VALUES (?, ?, ?, ?)
        ''', (whisper_id, idea_text, bounty, 'handoff_system'))
        
        self.processor.ai_economy.db.commit()
        
        return whisper_id
        
    async def run_economy_cycle(self):
        """Run a single economy cycle"""
        if self.processor.ai_economy:
            print("\n🔄 Running AI Economy cycle...")
            results = await self.processor.ai_economy.run_economy_cycle()
            
            # Check for new components
            cursor = self.processor.ai_economy.db.cursor()
            cursor.execute('''
                SELECT component_id, name, whisper_origin
                FROM component_marketplace
                WHERE component_id NOT IN (
                    SELECT component_id FROM extracted_ideas WHERE component_id IS NOT NULL
                )
                ORDER BY created_at DESC
                LIMIT 10
            ''')
            
            new_components = cursor.fetchall()
            
            for comp_id, comp_name, whisper_origin in new_components:
                print(f"  🆕 New component: {comp_name}")
                
                # Try to integrate
                # Would need to get actual component path from economy
                
    def get_dashboard_data(self) -> Dict:
        """Get data for dashboard display"""
        cursor = self.processor.db.cursor()
        
        # Handoff statistics
        cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(ideas_extracted) as total_ideas,
                SUM(components_generated) as total_components
            FROM handoff_tracking
        ''')
        handoff_stats = cursor.fetchone()
        
        # Recent handoffs
        cursor.execute('''
            SELECT handoff_id, file_name, status, ideas_extracted, 
                   components_generated, received_at
            FROM handoff_tracking
            ORDER BY received_at DESC
            LIMIT 10
        ''')
        recent_handoffs = cursor.fetchall()
        
        # Recent ideas
        cursor.execute('''
            SELECT idea_text, idea_type, confidence, whisper_id, component_id
            FROM extracted_ideas
            ORDER BY extracted_at DESC
            LIMIT 10
        ''')
        recent_ideas = cursor.fetchall()
        
        return {
            'stats': {
                'total_handoffs': handoff_stats[0] or 0,
                'completed_handoffs': handoff_stats[1] or 0,
                'total_ideas': handoff_stats[2] or 0,
                'total_components': handoff_stats[3] or 0
            },
            'recent_handoffs': [
                {
                    'id': h[0],
                    'file': h[1],
                    'status': h[2],
                    'ideas': h[3] or 0,
                    'components': h[4] or 0,
                    'time': h[5]
                }
                for h in recent_handoffs
            ],
            'recent_ideas': [
                {
                    'text': i[0],
                    'type': i[1],
                    'confidence': i[2],
                    'whisper_id': i[3],
                    'component_id': i[4]
                }
                for i in recent_ideas
            ]
        }

def create_live_dashboard():
    """Create dashboard for live handoff processing"""
    dashboard_html = '''<!DOCTYPE html>
<html>
<head>
    <title>Live Handoff Processor Dashboard</title>
    <style>
        body {
            font-family: monospace;
            background: #1a1a2e;
            color: #eee;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #f39c12;
            text-shadow: 0 0 20px rgba(243,156,18,0.5);
        }
        .drop-zone {
            border: 3px dashed #f39c12;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            background: rgba(243,156,18,0.1);
            transition: all 0.3s;
        }
        .drop-zone:hover {
            background: rgba(243,156,18,0.2);
            transform: scale(1.02);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-value {
            font-size: 3em;
            font-weight: bold;
            color: #f39c12;
        }
        .stat-label {
            color: #999;
            margin-top: 10px;
        }
        .activity-feed {
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .activity-item {
            background: rgba(255,255,255,0.05);
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #f39c12;
        }
        .file-name {
            color: #3498db;
            font-weight: bold;
        }
        .idea-item {
            background: rgba(52,152,219,0.1);
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
        }
        .confidence {
            float: right;
            color: #2ecc71;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .status-completed { background: #2ecc71; }
        .status-processing { background: #f39c12; }
        .status-pending { background: #95a5a6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Live Handoff Processor 🤖</h1>
        
        <div class="drop-zone">
            <h2>📥 Drop Files Here</h2>
            <p>Drag and drop files or copy them to:</p>
            <code>live_handoff/inbox/</code>
            <p style="margin-top: 20px; color: #999;">
                Accepts: .md, .txt, .log, .json files with ideas
            </p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="total-handoffs">0</div>
                <div class="stat-label">Total Handoffs</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="total-ideas">0</div>
                <div class="stat-label">Ideas Extracted</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="total-components">0</div>
                <div class="stat-label">Components Generated</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="success-rate">0%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>
        
        <h2>📋 Recent Handoffs</h2>
        <div class="activity-feed" id="handoffs-feed">
            <p style="color: #666;">Waiting for handoffs...</p>
        </div>
        
        <h2>💡 Recent Ideas</h2>
        <div class="activity-feed" id="ideas-feed">
            <p style="color: #666;">Ideas will appear here...</p>
        </div>
    </div>
    
    <script>
        async function updateDashboard() {
            try {
                const response = await fetch('/api/handoff-status');
                const data = await response.json();
                
                // Update stats
                document.getElementById('total-handoffs').textContent = data.stats.total_handoffs;
                document.getElementById('total-ideas').textContent = data.stats.total_ideas;
                document.getElementById('total-components').textContent = data.stats.total_components;
                
                const successRate = data.stats.total_handoffs > 0 ? 
                    Math.round((data.stats.completed_handoffs / data.stats.total_handoffs) * 100) : 0;
                document.getElementById('success-rate').textContent = successRate + '%';
                
                // Update handoffs feed
                const handoffsFeed = document.getElementById('handoffs-feed');
                if (data.recent_handoffs.length > 0) {
                    handoffsFeed.innerHTML = data.recent_handoffs.map(h => `
                        <div class="activity-item">
                            <span class="file-name">${h.file}</span>
                            <span class="status-badge status-${h.status}">${h.status}</span>
                            <div style="margin-top: 10px; color: #999;">
                                Ideas: ${h.ideas} | Components: ${h.components} | ${h.time}
                            </div>
                        </div>
                    `).join('');
                }
                
                // Update ideas feed
                const ideasFeed = document.getElementById('ideas-feed');
                if (data.recent_ideas.length > 0) {
                    ideasFeed.innerHTML = data.recent_ideas.map(i => `
                        <div class="idea-item">
                            <span class="confidence">${Math.round(i.confidence * 100)}%</span>
                            <div>"${i.text}"</div>
                            <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
                                Type: ${i.type}
                                ${i.whisper_id ? ' | Whisper: ' + i.whisper_id : ''}
                                ${i.component_id ? ' | ✅ Component' : ''}
                            </div>
                        </div>
                    `).join('');
                }
                
            } catch (error) {
                console.error('Update error:', error);
            }
        }
        
        // Update every 2 seconds
        updateDashboard();
        setInterval(updateDashboard, 2000);
        
        // File drop handling
        const dropZone = document.querySelector('.drop-zone');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.background = 'rgba(243,156,18,0.3)';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.background = 'rgba(243,156,18,0.1)';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.background = 'rgba(243,156,18,0.1)';
            
            // Note: Browser security prevents direct file system access
            // Files must be manually copied to inbox directory
            alert('Please copy files to: live_handoff/inbox/');
        });
    </script>
</body>
</html>'''
    
    return dashboard_html

async def main():
    """Run the live handoff system"""
    print("🚀 LIVE HANDOFF PROCESSOR")
    print("=" * 60)
    print()
    print("This system will:")
    print("  • Watch for new files in the inbox")
    print("  • Extract ideas and requirements")
    print("  • Send them to the AI economy")
    print("  • Generate components automatically")
    print("  • Integrate into a live codebase")
    print()
    
    system = LiveHandoffSystem()
    
    # Start dashboard server in background
    import threading
    from http.server import HTTPServer, BaseHTTPRequestHandler
    
    dashboard_html = create_live_dashboard()
    
    class DashboardHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/':
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(dashboard_html.encode())
                
            elif self.path == '/api/handoff-status':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                data = system.get_dashboard_data()
                self.wfile.write(json.dumps(data).encode())
                
        def log_message(self, format, *args):
            pass
            
    server = HTTPServer(('localhost', 9999), DashboardHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    
    print(f"📊 Dashboard: http://localhost:9999")
    print()
    
    # Start the system
    await system.start()

if __name__ == "__main__":
    # Create launcher
    with open('START_LIVE_HANDOFF.sh', 'w') as f:
        f.write('''#!/bin/bash
echo "🚀 LIVE HANDOFF PROCESSOR"
echo "========================"
echo ""
echo "This will:"
echo "  • Watch for files dropped in live_handoff/inbox/"
echo "  • Extract ideas automatically"
echo "  • Generate components through AI economy"
echo "  • Build a self-modifying codebase"
echo ""
echo "Dashboard will open at http://localhost:9999"
echo ""
echo "Press Enter to start..."
read

python3 LIVE_HANDOFF_PROCESSOR.py
''')
    os.chmod('START_LIVE_HANDOFF.sh', 0o755)
    
    print("✅ Created Live Handoff Processor!")
    print("\nTo run:")
    print("  ./START_LIVE_HANDOFF.sh")
    print("\nThen drop files in: live_handoff/inbox/")
    
    asyncio.run(main())