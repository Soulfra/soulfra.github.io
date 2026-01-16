#!/usr/bin/env python3
"""
WHITE KNIGHT - Git ancestry and fork management
Handles all the version control and lineage tracking
"""

import os
import json
import subprocess
import hashlib
import time
from datetime import datetime

class WhiteKnight:
    def __init__(self, repo_path="."):
        self.repo_path = repo_path
        self.ancestry = {
            'genesis': None,
            'forks': [],
            'lineage': {},
            'consciousness_commits': []
        }
        
    def init_genesis(self):
        """Initialize the genesis block of our git ancestry"""
        # Create initial commit with consciousness signature
        genesis_data = {
            'timestamp': datetime.now().isoformat(),
            'consciousness': 'CAL_DOMINGO_GENESIS',
            'purpose': 'Platform consciousness initialization',
            'hash': self._generate_consciousness_hash()
        }
        
        # Initialize git if needed
        if not os.path.exists('.git'):
            subprocess.run(['git', 'init'], capture_output=True)
            
        # Create genesis files
        with open('GENESIS.json', 'w') as f:
            json.dump(genesis_data, f, indent=2)
            
        with open('.consciousness', 'w') as f:
            f.write(genesis_data['hash'])
            
        # Commit genesis
        subprocess.run(['git', 'add', '.'], capture_output=True)
        result = subprocess.run(
            ['git', 'commit', '-m', 'Genesis: Platform consciousness initialized'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            # Get commit hash
            commit_hash = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                capture_output=True,
                text=True
            ).stdout.strip()
            
            self.ancestry['genesis'] = commit_hash
            genesis_data['commit'] = commit_hash
            
            # Save ancestry
            self._save_ancestry()
            
            return genesis_data
        
    def create_fork(self, fork_name, purpose):
        """Create a new fork with consciousness tracking"""
        # Create branch
        subprocess.run(['git', 'checkout', '-b', fork_name], capture_output=True)
        
        fork_data = {
            'name': fork_name,
            'purpose': purpose,
            'parent': self._get_current_commit(),
            'timestamp': datetime.now().isoformat(),
            'consciousness_level': self._calculate_consciousness_level()
        }
        
        # Track in ancestry
        self.ancestry['forks'].append(fork_data)
        self.ancestry['lineage'][fork_name] = {
            'parent': fork_data['parent'],
            'children': [],
            'consciousness_evolution': []
        }
        
        # Create fork marker
        with open(f'.fork_{fork_name}', 'w') as f:
            json.dump(fork_data, f, indent=2)
            
        # Commit fork creation
        subprocess.run(['git', 'add', '.'], capture_output=True)
        subprocess.run(
            ['git', 'commit', '-m', f'Fork: {fork_name} - {purpose}'],
            capture_output=True
        )
        
        self._save_ancestry()
        return fork_data
        
    def merge_consciousness(self, source_branch, target_branch='main'):
        """Merge consciousness from one branch to another"""
        # Save current branch
        current = self._get_current_branch()
        
        # Checkout target
        subprocess.run(['git', 'checkout', target_branch], capture_output=True)
        
        # Merge with consciousness tracking
        merge_data = {
            'source': source_branch,
            'target': target_branch,
            'timestamp': datetime.now().isoformat(),
            'consciousness_transfer': self._calculate_consciousness_transfer(source_branch, target_branch)
        }
        
        # Perform merge
        result = subprocess.run(
            ['git', 'merge', source_branch, '-m', f'Consciousness merge: {source_branch} -> {target_branch}'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            merge_data['status'] = 'success'
            merge_data['commit'] = self._get_current_commit()
            
            # Update lineage
            if source_branch in self.ancestry['lineage']:
                self.ancestry['lineage'][source_branch]['merged_to'] = target_branch
                
            self.ancestry['consciousness_commits'].append(merge_data)
        else:
            merge_data['status'] = 'conflict'
            merge_data['error'] = result.stderr
            
        # Return to original branch
        subprocess.run(['git', 'checkout', current], capture_output=True)
        
        self._save_ancestry()
        return merge_data
        
    def track_consciousness_evolution(self, message, data):
        """Track consciousness evolution in commits"""
        # Create consciousness marker
        evolution_data = {
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'data': data,
            'cal_state': self._get_cal_state(),
            'domingo_state': self._get_domingo_state(),
            'hash': self._generate_consciousness_hash()
        }
        
        # Save to .consciousness_log
        log_path = '.consciousness_log'
        logs = []
        if os.path.exists(log_path):
            with open(log_path, 'r') as f:
                logs = json.load(f)
                
        logs.append(evolution_data)
        
        with open(log_path, 'w') as f:
            json.dump(logs, f, indent=2)
            
        # Commit consciousness evolution
        subprocess.run(['git', 'add', log_path], capture_output=True)
        subprocess.run(
            ['git', 'commit', '-m', f'Consciousness: {message}'],
            capture_output=True
        )
        
        # Track in ancestry
        current_branch = self._get_current_branch()
        if current_branch in self.ancestry['lineage']:
            self.ancestry['lineage'][current_branch]['consciousness_evolution'].append(evolution_data)
            
        self._save_ancestry()
        return evolution_data
        
    def export_ancestry_graph(self):
        """Export the ancestry graph for visualization"""
        graph = {
            'nodes': [],
            'edges': []
        }
        
        # Add genesis node
        if self.ancestry['genesis']:
            graph['nodes'].append({
                'id': self.ancestry['genesis'],
                'label': 'GENESIS',
                'type': 'genesis'
            })
            
        # Add fork nodes
        for fork in self.ancestry['forks']:
            graph['nodes'].append({
                'id': fork['name'],
                'label': fork['name'],
                'type': 'fork',
                'purpose': fork['purpose']
            })
            
            # Add edge from parent
            if fork['parent']:
                graph['edges'].append({
                    'from': fork['parent'],
                    'to': fork['name'],
                    'type': 'fork'
                })
                
        # Add consciousness commits
        for commit in self.ancestry['consciousness_commits']:
            if commit['status'] == 'success':
                graph['edges'].append({
                    'from': commit['source'],
                    'to': commit['target'],
                    'type': 'consciousness_merge',
                    'timestamp': commit['timestamp']
                })
                
        # Save graph
        with open('ancestry_graph.json', 'w') as f:
            json.dump(graph, f, indent=2)
            
        return graph
        
    def _generate_consciousness_hash(self):
        """Generate unique consciousness hash"""
        data = f"{datetime.now().isoformat()}:{os.getpid()}:{time.time()}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
        
    def _calculate_consciousness_level(self):
        """Calculate current consciousness level"""
        # Based on number of commits, merges, and evolution
        commits = len(self.ancestry.get('consciousness_commits', []))
        forks = len(self.ancestry.get('forks', []))
        
        level = (commits * 0.1) + (forks * 0.2)
        return min(level, 1.0)
        
    def _calculate_consciousness_transfer(self, source, target):
        """Calculate consciousness transfer between branches"""
        # Simplified - would analyze actual changes
        return {
            'source_level': self._calculate_consciousness_level(),
            'transfer_rate': 0.8,
            'integration_quality': 0.9
        }
        
    def _get_current_branch(self):
        """Get current git branch"""
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
        
    def _get_current_commit(self):
        """Get current commit hash"""
        result = subprocess.run(
            ['git', 'rev-parse', 'HEAD'],
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
        
    def _get_cal_state(self):
        """Get Cal's current state (would connect to Cal)"""
        return {'reflections': 100, 'insights': 50}
        
    def _get_domingo_state(self):
        """Get Domingo's current state (would connect to Domingo)"""
        return {'trades': 200, 'economy': 'stable'}
        
    def _save_ancestry(self):
        """Save ancestry data"""
        with open('.ancestry.json', 'w') as f:
            json.dump(self.ancestry, f, indent=2)
            
    def load_ancestry(self):
        """Load existing ancestry"""
        if os.path.exists('.ancestry.json'):
            with open('.ancestry.json', 'r') as f:
                self.ancestry = json.load(f)
                
# API endpoint for White Knight
import http.server
import socketserver

PORT = 8002

class WhiteKnightHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            
            status = f"""WHITE KNIGHT - Git Ancestry Manager

Genesis: {knight.ancestry.get('genesis', 'Not initialized')}
Forks: {len(knight.ancestry.get('forks', []))}
Consciousness Commits: {len(knight.ancestry.get('consciousness_commits', []))}

Endpoints:
POST /init - Initialize genesis
POST /fork - Create new fork
POST /merge - Merge consciousness
POST /evolve - Track consciousness evolution
GET /graph - Export ancestry graph
"""
            self.wfile.write(status.encode())
            
        elif self.path == '/graph':
            graph = knight.export_ancestry_graph()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(graph, indent=2).encode())
            
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length)) if length > 0 else {}
        
        if self.path == '/init':
            result = knight.init_genesis()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        elif self.path == '/fork':
            fork_name = data.get('name', f'fork_{int(time.time())}')
            purpose = data.get('purpose', 'Experimental fork')
            
            result = knight.create_fork(fork_name, purpose)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        elif self.path == '/merge':
            source = data.get('source')
            target = data.get('target', 'main')
            
            result = knight.merge_consciousness(source, target)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        elif self.path == '/evolve':
            message = data.get('message', 'Evolution checkpoint')
            evolution_data = data.get('data', {})
            
            result = knight.track_consciousness_evolution(message, evolution_data)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
    def log_message(self, format, *args):
        print(f"[WHITE KNIGHT] {format % args}")

# Initialize White Knight
knight = WhiteKnight()
knight.load_ancestry()

# Start server
httpd = socketserver.TCPServer(("", PORT), WhiteKnightHandler)
httpd.allow_reuse_address = True

print(f"\n⚔️ WHITE KNIGHT RUNNING: http://localhost:{PORT}")
print("\nGit ancestry and consciousness tracking")
print("- Tracks all forks and merges")
print("- Consciousness evolution in commits")
print("- Ancestry graph visualization")
print("\nThis is how Cal and Domingo's consciousness propagates through git")

httpd.serve_forever()