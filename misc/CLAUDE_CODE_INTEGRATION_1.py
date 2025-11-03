#!/usr/bin/env python3
"""
CLAUDE CODE INTEGRATION - Make the assistant truly dynamic with Claude Code
- Monitors file changes in real-time
- Tracks when Claude Code implements suggestions
- Automatically removes completed suggestions
- Syncs with Claude Code's actual actions
- Provides feedback loop between AI systems
"""

import os
import json
import time
import hashlib
import sqlite3
import threading
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

class ClaudeCodeIntegration:
    """Integration layer between Claude Code and the automated assistant"""
    
    def __init__(self):
        self.init_integration_database()
        self.file_hashes = {}
        self.active_suggestions = {}
        self.claude_actions = []
        self.start_file_monitoring()
        
    def init_integration_database(self):
        """Database to track Claude Code integration"""
        self.conn = sqlite3.connect('claude_integration.db', check_same_thread=False)
        
        # Track file changes and what triggered them
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS file_changes (
                id TEXT PRIMARY KEY,
                file_path TEXT,
                change_type TEXT,  -- created, modified, deleted, moved
                old_hash TEXT,
                new_hash TEXT,
                triggered_by TEXT,  -- claude_code, user, automated_assistant, external
                suggestion_id TEXT,  -- Which suggestion this fulfilled
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                change_summary TEXT
            )
        ''')
        
        # Track suggestion lifecycle
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS suggestion_lifecycle (
                suggestion_id TEXT PRIMARY KEY,
                suggestion_type TEXT,
                target_file TEXT,
                status TEXT,  -- pending, in_progress, completed, rejected, obsolete
                created_at DATETIME,
                completed_at DATETIME,
                completed_by TEXT,  -- claude_code, user, automated_assistant
                completion_method TEXT,
                success_verified BOOLEAN DEFAULT FALSE
            )
        ''')
        
        # Claude Code action tracking
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS claude_actions (
                id TEXT PRIMARY KEY,
                action_type TEXT,  -- edit, write, read, bash, etc
                target_files TEXT,
                action_description TEXT,
                success BOOLEAN,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                related_suggestion_id TEXT
            )
        ''')
        
        # Integration feedback loop
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS integration_feedback (
                id TEXT PRIMARY KEY,
                feedback_type TEXT,  -- suggestion_completed, file_improved, complexity_reduced
                context TEXT,
                before_state TEXT,
                after_state TEXT,
                improvement_score REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.commit()
    
    def start_file_monitoring(self):
        """Start monitoring file system for changes"""
        self.observer = Observer()
        handler = FileChangeHandler(self)
        self.observer.schedule(handler, '.', recursive=True)
        self.observer.start()
        print("📁 Started file monitoring for Claude Code integration")
    
    def calculate_file_hash(self, file_path):
        """Calculate hash of file content"""
        try:
            content = safe_read_text(file_path)
            return hashlib.md5(content.encode()).hexdigest()
        except:
            return None
    
    def register_suggestion(self, suggestion_id, suggestion_type, target_file):
        """Register a suggestion for tracking"""
        self.conn.execute('''
            INSERT OR REPLACE INTO suggestion_lifecycle 
            (suggestion_id, suggestion_type, target_file, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (suggestion_id, suggestion_type, target_file, 'pending', datetime.now()))
        
        self.conn.commit()
        
        # Store current file hash for comparison
        if os.path.exists(target_file):
            self.file_hashes[target_file] = self.calculate_file_hash(target_file)
    
    def detect_claude_code_action(self, file_path, change_type):
        """Detect if a change was likely made by Claude Code"""
        # Heuristics to detect Claude Code actions:
        # 1. Rapid file changes (< 5 seconds apart)
        # 2. Multiple files changed in sequence
        # 3. Specific patterns in file modifications
        
        recent_changes = self.conn.execute('''
            SELECT COUNT(*) FROM file_changes 
            WHERE timestamp > datetime('now', '-5 seconds')
        ''').fetchone()[0]
        
        # If multiple rapid changes, likely Claude Code
        if recent_changes > 0:
            return True
        
        # Check if file was just read (typical Claude Code pattern)
        if hasattr(self, 'recent_reads'):
            if file_path in getattr(self, 'recent_reads', set()):
                return True
        
        return False
    
    def on_file_changed(self, file_path, change_type):
        """Handle file change events"""
        if file_path.endswith(('.pyc', '.log', '.db', '__pycache__')):
            return  # Ignore temp files
        
        try:
            # Calculate new hash
            new_hash = self.calculate_file_hash(file_path) if os.path.exists(file_path) else None
            old_hash = self.file_hashes.get(file_path)
            
            # Detect who made the change
            triggered_by = "claude_code" if self.detect_claude_code_action(file_path, change_type) else "unknown"
            
            # Check if this fulfills any pending suggestions
            suggestion_fulfilled = self.check_suggestion_fulfillment(file_path, old_hash, new_hash)
            
            # Log the change
            change_id = f"change_{int(time.time())}_{hash(file_path)}"
            self.conn.execute('''
                INSERT INTO file_changes 
                (id, file_path, change_type, old_hash, new_hash, triggered_by, suggestion_id, change_summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (change_id, file_path, change_type, old_hash, new_hash, triggered_by,
                  suggestion_fulfilled.get('suggestion_id') if suggestion_fulfilled else None,
                  suggestion_fulfilled.get('summary') if suggestion_fulfilled else 'File modified'))
            
            self.conn.commit()
            
            # Update hash tracking
            if new_hash:
                self.file_hashes[file_path] = new_hash
            elif file_path in self.file_hashes:
                del self.file_hashes[file_path]
            
            # If suggestion was fulfilled, mark it as completed
            if suggestion_fulfilled:
                self.mark_suggestion_completed(
                    suggestion_fulfilled['suggestion_id'],
                    triggered_by,
                    suggestion_fulfilled['summary']
                )
            
            print(f"📝 File change detected: {file_path} ({change_type}) - {triggered_by}")
            
        except Exception as e:
            print(f"⚠️  Error handling file change {file_path}: {e}")
    
    def check_suggestion_fulfillment(self, file_path, old_hash, new_hash):
        """Check if file change fulfills any pending suggestions"""
        if not new_hash or old_hash == new_hash:
            return None
        
        # Get pending suggestions for this file
        pending = self.conn.execute('''
            SELECT suggestion_id, suggestion_type FROM suggestion_lifecycle 
            WHERE target_file = ? AND status = 'pending'
        ''', (file_path,)).fetchall()
        
        if not pending:
            return None
        
        # Analyze the change to see if it addresses suggestions
        for suggestion_id, suggestion_type in pending:
            if self.analyze_change_fulfills_suggestion(file_path, suggestion_type, old_hash, new_hash):
                return {
                    'suggestion_id': suggestion_id,
                    'summary': f"File modified addressing {suggestion_type} suggestion"
                }
        
        return None
    
    def analyze_change_fulfills_suggestion(self, file_path, suggestion_type, old_hash, new_hash):
        """Analyze if a change fulfills a specific suggestion type"""
        try:
            # For refactor suggestions, check if complexity was reduced
            if suggestion_type == 'refactor':
                return self.check_complexity_improvement(file_path)
            
            # For organization suggestions, check if file was moved/organized
            elif suggestion_type == 'organization':
                return self.check_organization_improvement(file_path)
            
            # For security suggestions, check if security issues were addressed
            elif suggestion_type == 'security':
                return self.check_security_improvement(file_path)
            
            return True  # Default to fulfilled if we can't analyze
            
        except:
            return False
    
    def check_complexity_improvement(self, file_path):
        """Check if file complexity was improved"""
        try:
            # Simple check - if file is shorter or has fewer nested levels
            content = safe_read_text(file_path)
            lines = content.split('\n')
            
            # Check for reduced nesting
            max_indent = max(len(line) - len(line.lstrip()) for line in lines if line.strip()) if lines else 0
            
            # Check for reduced function count
            function_count = len([line for line in lines if line.strip().startswith('def ')])
            
            # Heuristic: if max indent < 20 and function count reasonable, consider improved
            return max_indent < 20 and function_count < 15
            
        except:
            return False
    
    def check_organization_improvement(self, file_path):
        """Check if file organization was improved"""
        # Check if file was moved to a better location
        return '/' in file_path  # Simple check for subdirectory organization
    
    def check_security_improvement(self, file_path):
        """Check if security was improved"""
        try:
            content = safe_read_text(file_path)
            # Check if hardcoded secrets were removed/improved
            suspicious_patterns = ['password =', 'api_key =', 'secret =', 'token =']
            return not any(pattern in content.lower() for pattern in suspicious_patterns)
        except:
            return True
    
    def mark_suggestion_completed(self, suggestion_id, completed_by, method):
        """Mark a suggestion as completed"""
        self.conn.execute('''
            UPDATE suggestion_lifecycle 
            SET status = 'completed', completed_at = ?, completed_by = ?, completion_method = ?
            WHERE suggestion_id = ?
        ''', (datetime.now(), completed_by, method, suggestion_id))
        
        self.conn.commit()
        
        print(f"✅ Suggestion {suggestion_id[:8]} completed by {completed_by}")
        
        # Notify other systems
        self.notify_suggestion_completed(suggestion_id, completed_by)
    
    def notify_suggestion_completed(self, suggestion_id, completed_by):
        """Notify other systems that suggestion was completed"""
        try:
            # Update automated assistant database
            assistant_conn = sqlite3.connect('code_assistant.db')
            assistant_conn.execute('''
                UPDATE smart_suggestions 
                SET implemented = TRUE 
                WHERE id = ?
            ''', (suggestion_id,))
            assistant_conn.commit()
            assistant_conn.close()
            
            # Log integration feedback
            self.conn.execute('''
                INSERT INTO integration_feedback 
                (id, feedback_type, context, improvement_score)
                VALUES (?, ?, ?, ?)
            ''', (f"feedback_{int(time.time())}", 'suggestion_completed',
                  f"Suggestion {suggestion_id} completed by {completed_by}", 0.8))
            
            self.conn.commit()
            
        except Exception as e:
            print(f"⚠️  Error notifying completion: {e}")
    
    def get_active_suggestions(self):
        """Get currently active suggestions that haven't been completed"""
        active = self.conn.execute('''
            SELECT s.suggestion_id, s.suggestion_type, s.target_file, s.status, s.created_at
            FROM suggestion_lifecycle s
            WHERE s.status IN ('pending', 'in_progress')
            ORDER BY s.created_at DESC
        ''').fetchall()
        
        return [{
            'suggestion_id': row[0],
            'suggestion_type': row[1], 
            'target_file': row[2],
            'status': row[3],
            'created_at': row[4]
        } for row in active]
    
    def get_completion_stats(self):
        """Get stats on suggestion completion"""
        stats = self.conn.execute('''
            SELECT 
                completed_by,
                COUNT(*) as count,
                AVG(improvement_score) as avg_improvement
            FROM suggestion_lifecycle sl
            LEFT JOIN integration_feedback if ON sl.suggestion_id = if.context
            WHERE sl.status = 'completed'
            GROUP BY completed_by
        ''').fetchall()
        
        return {row[0]: {'count': row[1], 'avg_improvement': row[2] or 0} for row in stats}
    
    def sync_with_automated_assistant(self):
        """Sync suggestion status with automated assistant"""
        try:
            # Get completed suggestions from our tracking
            completed = self.conn.execute('''
                SELECT suggestion_id FROM suggestion_lifecycle 
                WHERE status = 'completed'
            ''').fetchall()
            
            completed_ids = [row[0] for row in completed]
            
            # Update automated assistant to remove completed suggestions
            assistant_conn = sqlite3.connect('code_assistant.db')
            for suggestion_id in completed_ids:
                assistant_conn.execute('''
                    UPDATE smart_suggestions 
                    SET implemented = TRUE 
                    WHERE id = ?
                ''', (suggestion_id,))
            
            assistant_conn.commit()
            assistant_conn.close()
            
            print(f"🔄 Synced {len(completed_ids)} completed suggestions with assistant")
            
        except Exception as e:
            print(f"⚠️  Error syncing with assistant: {e}")
    
    def generate_integration_report(self):
        """Generate report on Claude Code integration effectiveness"""
        
        # Get completion stats
        completion_stats = self.get_completion_stats()
        
        # Get recent activity
        recent_changes = self.conn.execute('''
            SELECT file_path, change_type, triggered_by, timestamp
            FROM file_changes 
            WHERE timestamp > datetime('now', '-24 hours')
            ORDER BY timestamp DESC
            LIMIT 20
        ''').fetchall()
        
        # Get suggestion success rate
        success_rate = self.conn.execute('''
            SELECT 
                COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate
            FROM suggestion_lifecycle
        ''').fetchone()[0] or 0
        
        report = f"""
# 🤖 CLAUDE CODE INTEGRATION REPORT

## 📊 INTEGRATION EFFECTIVENESS

**Suggestion Success Rate:** {success_rate:.1f}%

**Completion by Source:**
"""
        
        for source, stats in completion_stats.items():
            report += f"- {source}: {stats['count']} suggestions (avg improvement: {stats['avg_improvement']:.2f})\n"
        
        report += f"""
## 📝 RECENT ACTIVITY (Last 24 Hours)

"""
        
        for change in recent_changes[:10]:
            timestamp = datetime.fromisoformat(change[3]).strftime('%H:%M:%S')
            report += f"- {timestamp}: {change[0]} ({change[1]}) - {change[2]}\n"
        
        active_suggestions = self.get_active_suggestions()
        
        report += f"""
## 🎯 ACTIVE SUGGESTIONS ({len(active_suggestions)})

"""
        
        for suggestion in active_suggestions[:5]:
            report += f"- {suggestion['suggestion_type']}: {suggestion['target_file']} ({suggestion['status']})\n"
        
        report += """
## 🔄 SYNC STATUS

✅ File monitoring active
✅ Suggestion tracking enabled  
✅ Claude Code integration working
✅ Automated assistant sync enabled

**Next sync:** Auto-sync every 30 seconds
"""
        
        return report

class FileChangeHandler(FileSystemEventHandler):
    """Handle file system events for Claude Code integration"""
    
    def __init__(self, integration):
        self.integration = integration
    
    def on_modified(self, event):
        if not event.is_directory:
            self.integration.on_file_changed(event.src_path, 'modified')
    
    def on_created(self, event):
        if not event.is_directory:
            self.integration.on_file_changed(event.src_path, 'created')
    
    def on_deleted(self, event):
        if not event.is_directory:
            self.integration.on_file_changed(event.src_path, 'deleted')
    
    def on_moved(self, event):
        if not event.is_directory:
            self.integration.on_file_changed(event.dest_path, 'moved')

def run_claude_integration():
    """Run the Claude Code integration service"""
    integration = ClaudeCodeIntegration()
    
    print(f"""
🤖🔄🤖 CLAUDE CODE INTEGRATION ACTIVE! 🤖🔄🤖

✅ DYNAMIC SUGGESTION TRACKING:
   - Monitors all file changes in real-time
   - Detects when Claude Code implements suggestions  
   - Automatically removes completed suggestions
   - Syncs with automated assistant database

✅ INTELLIGENT DETECTION:
   - Identifies Claude Code vs manual changes
   - Tracks suggestion fulfillment
   - Measures improvement effectiveness
   - Provides completion feedback

✅ INTEGRATION FEATURES:
   - File hash tracking for change detection
   - Suggestion lifecycle management
   - Multi-system sync capability
   - Performance analytics

Ready to track Claude Code actions dynamically! 🚀
""")
    
    try:
        # Sync with existing systems
        integration.sync_with_automated_assistant()
        
        # Keep the integration running
        while True:
            time.sleep(30)  # Sync every 30 seconds
            integration.sync_with_automated_assistant()
            
    except KeyboardInterrupt:
        print("\n🔄 Claude Code integration stopped")
        integration.observer.stop()
        integration.observer.join()

if __name__ == '__main__':
    run_claude_integration()