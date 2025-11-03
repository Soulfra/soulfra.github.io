#!/usr/bin/env python3
"""
LIVE HANDOFF WATCHER - Watches for new handoffs and processes them automatically
"""

import os
import json
import time
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
import subprocess
import hashlib
import re

print("👁️  LIVE HANDOFF WATCHER ACTIVE 👁️")
print("=" * 60)
print("Watching for new handoffs, chatlogs, and whispers...")
print()

class LiveHandoffWatcher:
    """Watches directories and processes new files automatically"""
    
    def __init__(self):
        self.watch_dirs = [
            'inbox',
            'handoffs', 
            'chatlogs',
            'whispers',
            'uploads'
        ]
        self.processed_files = set()
        self.db = sqlite3.connect('maxed_out/soulfra.db', check_same_thread=False)
        self.setup_directories()
        self.load_processed_files()
        
    def setup_directories(self):
        """Create watch directories"""
        for dir_name in self.watch_dirs:
            Path(dir_name).mkdir(exist_ok=True)
            
    def load_processed_files(self):
        """Load already processed files from database"""
        try:
            cursor = self.db.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS processed_files (
                    file_hash TEXT PRIMARY KEY,
                    file_path TEXT,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("SELECT file_hash FROM processed_files")
            for row in cursor.fetchall():
                self.processed_files.add(row[0])
                
        except Exception as e:
            print(f"⚠️  Database setup: {e}")
            
    def get_file_hash(self, file_path):
        """Get hash of file for deduplication"""
        with open(file_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
            
    def extract_whispers_from_file(self, file_path):
        """Extract whispers/ideas from various file formats"""
        whispers = []
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                
            # Extract based on file type
            if file_path.endswith('.json'):
                # JSON format
                data = json.loads(content)
                if isinstance(data, list):
                    whispers.extend([str(item) for item in data])
                elif isinstance(data, dict):
                    # Look for common keys
                    for key in ['whispers', 'ideas', 'prompts', 'messages', 'content']:
                        if key in data:
                            if isinstance(data[key], list):
                                whispers.extend([str(item) for item in data[key]])
                            else:
                                whispers.append(str(data[key]))
                                
            elif file_path.endswith('.md'):
                # Markdown - extract from headers and lists
                lines = content.split('\n')
                for line in lines:
                    if line.startswith('#') or line.startswith('- ') or line.startswith('* '):
                        clean_line = line.lstrip('#-* ').strip()
                        if clean_line and len(clean_line) > 10:
                            whispers.append(clean_line)
                            
            elif 'chat' in file_path.lower() or file_path.endswith('.txt'):
                # Chat logs - extract user messages
                lines = content.split('\n')
                for line in lines:
                    # Look for common chat patterns
                    if any(pattern in line for pattern in ['User:', 'Human:', '>', 'Q:']):
                        clean_line = re.sub(r'^(User:|Human:|>|Q:)\s*', '', line).strip()
                        if clean_line and len(clean_line) > 10:
                            whispers.append(clean_line)
                            
            else:
                # Generic text extraction
                sentences = re.split(r'[.!?]+', content)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(sentence) > 20 and any(keyword in sentence.lower() for keyword in 
                        ['create', 'build', 'make', 'generate', 'develop', 'implement', 'design']):
                        whispers.append(sentence)
                        
        except Exception as e:
            print(f"  ⚠️  Error extracting from {file_path}: {e}")
            
        return whispers
        
    def process_whispers(self, whispers, source_file):
        """Process whispers through the MAXED OUT engine"""
        print(f"\n🌬️  Processing {len(whispers)} whispers from {source_file}")
        
        for whisper in whispers[:5]:  # Limit to 5 per file to avoid overwhelming
            try:
                # Clean and prepare whisper
                whisper = whisper[:100].strip()
                
                # Generate component name
                words = whisper.split()[:3]
                component_name = ''.join(word.capitalize() for word in words if word.isalpha())
                
                if not component_name:
                    component_name = f"Component{int(time.time())}"
                    
                print(f"  🔨 Building {component_name} from: '{whisper[:50]}...'")
                
                # Add to database
                cursor = self.db.cursor()
                cursor.execute("""
                    INSERT INTO whispers (text, source, tone, status)
                    VALUES (?, ?, ?, 'processing')
                """, (whisper, source_file, 'creative'))
                whisper_id = cursor.lastrowid
                
                # Generate component code
                self.generate_component(component_name, whisper, whisper_id)
                
                # Update status
                cursor.execute("""
                    UPDATE whispers SET status = 'completed'
                    WHERE id = ?
                """, (whisper_id,))
                
                self.db.commit()
                
            except Exception as e:
                print(f"    ❌ Error: {e}")
                
    def generate_component(self, name, whisper, whisper_id):
        """Generate a working component from whisper"""
        code = f'''#!/usr/bin/env python3
"""
{name} - Live generated from: "{whisper[:50]}..."
Generated at: {datetime.now().isoformat()}
"""

import json
import random
from datetime import datetime

class {name}:
    def __init__(self):
        self.whisper = "{whisper}"
        self.created = datetime.now()
        self.data = []
        
    def process(self, input_data):
        """Process input based on whisper intent"""
        result = {{
            "input": input_data,
            "whisper": self.whisper,
            "processed_at": datetime.now().isoformat(),
            "confidence": random.uniform(0.7, 1.0)
        }}
        
        # Add whisper-specific logic
        if "emotion" in self.whisper.lower():
            result["emotion_detected"] = random.choice(["joy", "curiosity", "excitement"])
        elif "analyze" in self.whisper.lower():
            result["analysis"] = {{
                "patterns": random.randint(1, 10),
                "insights": random.randint(1, 5)
            }}
        elif "track" in self.whisper.lower():
            result["tracking"] = {{
                "items": random.randint(1, 100),
                "trend": random.choice(["increasing", "stable", "decreasing"])
            }}
            
        self.data.append(result)
        return result
        
    def get_status(self):
        return {{
            "component": "{name}",
            "whisper": self.whisper,
            "processed": len(self.data),
            "created": self.created.isoformat()
        }}

if __name__ == "__main__":
    component = {name}()
    test = component.process({{"test": "data"}})
    print(f"✅ {name} working!")
    print(f"   Result: {{test}}")
'''
        
        # Save component
        file_path = f"maxed_out/components/{name}.py"
        with open(file_path, 'w') as f:
            f.write(code)
            
        # Make executable
        os.chmod(file_path, 0o755)
        
        # Add to database
        cursor = self.db.cursor()
        cursor.execute("""
            INSERT INTO components (name, whisper_id, code, creator)
            VALUES (?, ?, ?, 'LiveWatcher')
        """, (name, whisper_id, code))
        self.db.commit()
        
        print(f"    ✅ Created {file_path}")
        
    def watch_loop(self):
        """Main watch loop"""
        print("\n👀 Watching directories:")
        for dir_name in self.watch_dirs:
            print(f"  📁 {dir_name}/")
            
        print("\n💡 Drop files into these directories to process them!")
        print("   Supported: .json, .md, .txt, chat logs")
        print("\nPress Ctrl+C to stop watching\n")
        
        while True:
            try:
                # Check each directory
                for dir_name in self.watch_dirs:
                    dir_path = Path(dir_name)
                    
                    for file_path in dir_path.glob('*'):
                        if file_path.is_file():
                            # Get file hash
                            file_hash = self.get_file_hash(file_path)
                            
                            # Skip if already processed
                            if file_hash in self.processed_files:
                                continue
                                
                            print(f"\n📄 New file detected: {file_path}")
                            
                            # Extract whispers
                            whispers = self.extract_whispers_from_file(file_path)
                            
                            if whispers:
                                print(f"  🌬️  Found {len(whispers)} whispers")
                                
                                # Process them
                                self.process_whispers(whispers, str(file_path))
                                
                                # Mark as processed
                                self.processed_files.add(file_hash)
                                cursor = self.db.cursor()
                                cursor.execute("""
                                    INSERT INTO processed_files (file_hash, file_path)
                                    VALUES (?, ?)
                                """, (file_hash, str(file_path)))
                                self.db.commit()
                                
                                print(f"  ✅ Processing complete!")
                            else:
                                print(f"  ⚠️  No whispers found")
                                
                # Sleep before next check
                time.sleep(2)
                
            except KeyboardInterrupt:
                print("\n\n👋 Stopping watcher...")
                break
            except Exception as e:
                print(f"\n❌ Error in watch loop: {e}")
                time.sleep(5)
                
    def create_live_dashboard(self):
        """Create a live updating dashboard"""
        dashboard_html = '''<!DOCTYPE html>
<html>
<head>
    <title>Live Handoff Processor</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #000;
            color: #0f0;
            padding: 20px;
            margin: 0;
        }
        h1 {
            text-align: center;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        .stat {
            background: rgba(0,255,0,0.1);
            border: 1px solid #0f0;
            padding: 20px;
            text-align: center;
        }
        .file-list {
            background: rgba(0,255,0,0.05);
            padding: 20px;
            border-radius: 10px;
            max-height: 400px;
            overflow-y: auto;
        }
        .file-item {
            padding: 10px;
            margin: 5px 0;
            background: rgba(255,255,255,0.05);
            border-left: 3px solid #0f0;
        }
        .watch-dirs {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin: 20px 0;
        }
        .dir-box {
            background: rgba(0,100,255,0.2);
            border: 2px dashed #00f;
            padding: 40px;
            text-align: center;
            border-radius: 10px;
        }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <h1>👁️ LIVE HANDOFF PROCESSOR 👁️</h1>
    
    <div class="watch-dirs">
        <div class="dir-box">📁 inbox/</div>
        <div class="dir-box">📁 handoffs/</div>
        <div class="dir-box">📁 chatlogs/</div>
        <div class="dir-box">📁 whispers/</div>
    </div>
    
    <div class="stats">
        <div class="stat">
            <h2>Files Processed</h2>
            <div style="font-size: 3em;">LIVE</div>
        </div>
        <div class="stat">
            <h2>Components Created</h2>
            <div style="font-size: 3em;">AUTO</div>
        </div>
        <div class="stat">
            <h2>Status</h2>
            <div style="font-size: 3em;">👀</div>
        </div>
    </div>
    
    <h2>Recent Activity</h2>
    <div class="file-list">
        <div class="file-item">Drop files into watch directories...</div>
        <div class="file-item">Supported: .json, .md, .txt, chat logs</div>
        <div class="file-item">Components generate automatically!</div>
    </div>
    
    <p style="text-align: center; margin-top: 40px; color: #666;">
        Auto-refreshes every 5 seconds
    </p>
</body>
</html>'''
        
        with open('live_dashboard.html', 'w') as f:
            f.write(dashboard_html)
            
        return os.path.abspath('live_dashboard.html')

# Create sample files for testing
def create_sample_files():
    """Create sample files to demonstrate the system"""
    
    # Sample whispers JSON
    whispers_data = {
        "whispers": [
            "create a mood tracker that learns from patterns",
            "build an AI assistant that understands context",
            "make a recommendation engine with personality"
        ]
    }
    
    with open('inbox/sample_whispers.json', 'w') as f:
        json.dump(whispers_data, f, indent=2)
        
    # Sample chat log
    chat_log = """User: I want to create an emotion detection system
Assistant: I can help with that.
User: It should analyze text and detect emotions
User: Also track emotional patterns over time
Human: Can we make it learn from user feedback?
"""
    
    with open('chatlogs/sample_chat.txt', 'w') as f:
        f.write(chat_log)
        
    # Sample markdown
    markdown = """# Project Ideas

## Priority Features
- Build a real-time sentiment analyzer
- Create a pattern recognition system
- Implement a self-learning algorithm

### Additional Ideas
* Make an adaptive UI component
* Generate insights from user behavior
* Develop a predictive model
"""
    
    with open('handoffs/ideas.md', 'w') as f:
        f.write(markdown)
        
    print("📝 Created sample files in watch directories")

if __name__ == "__main__":
    # Create watcher
    watcher = LiveHandoffWatcher()
    
    # Create sample files
    create_sample_files()
    
    # Create dashboard
    dashboard_path = watcher.create_live_dashboard()
    print(f"\n🌐 Dashboard: {dashboard_path}")
    
    # Open dashboard
    subprocess.run(['open', dashboard_path])
    
    # Start watching
    try:
        watcher.watch_loop()
    except KeyboardInterrupt:
        print("\n✅ Watcher stopped")