#!/usr/bin/env python3
"""
SOULFRA SELF-AWARE SYSTEM
The system that discovers what it already has and uses it intelligently
- Scans entire codebase
- Understands relationships
- Predicts needs before they arise
- Self-configures based on what exists
"""

import os
import ast
import json
import re
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import hashlib
from collections import defaultdict

class CodebaseDiscovery:
    """Discovers and understands the entire codebase"""
    
    def __init__(self):
        self.root_path = Path.cwd()
        self.discovery_db = "soulfra_discovery.db"
        self.components = {}
        self.relationships = defaultdict(set)
        self.capabilities = defaultdict(list)
        self.setup_database()
        
    def setup_database(self):
        """Setup discovery database"""
        conn = sqlite3.connect(self.discovery_db)
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS components (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT,
                path TEXT,
                purpose TEXT,
                imports TEXT,
                exports TEXT,
                ports TEXT,
                dependencies TEXT,
                capabilities TEXT,
                last_modified TIMESTAMP,
                content_hash TEXT
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_component TEXT,
                to_component TEXT,
                relationship_type TEXT,
                strength REAL,
                discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_type TEXT,
                pattern_data TEXT,
                frequency INTEGER,
                components TEXT,
                discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def discover_everything(self):
        """Scan and understand entire codebase"""
        print("🔍 Discovering existing components...")
        
        # Find all Python files
        python_files = list(self.root_path.rglob("*.py"))
        
        # Find all config files
        config_files = list(self.root_path.rglob("*.json")) + \
                      list(self.root_path.rglob("*.yml")) + \
                      list(self.root_path.rglob("*.yaml")) + \
                      list(self.root_path.rglob("*.conf"))
                      
        # Find all documentation
        docs = list(self.root_path.rglob("*.md")) + \
               list(self.root_path.rglob("*.txt"))
               
        print(f"Found {len(python_files)} Python files")
        print(f"Found {len(config_files)} config files")
        print(f"Found {len(docs)} documentation files")
        
        # Analyze each component
        for py_file in python_files:
            self.analyze_python_file(py_file)
            
        # Find relationships
        self.discover_relationships()
        
        # Identify patterns
        self.identify_patterns()
        
        # Save discoveries
        self.save_discoveries()
        
        return self.generate_discovery_report()
        
    def analyze_python_file(self, file_path: Path):
        """Analyze a Python file to understand its purpose"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Calculate content hash
            content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
            
            # Extract metadata
            metadata = {
                'name': file_path.stem,
                'path': str(file_path),
                'type': self.identify_component_type(content, file_path.name),
                'purpose': self.extract_purpose(content),
                'imports': self.extract_imports(content),
                'exports': self.extract_exports(content),
                'ports': self.extract_ports(content),
                'capabilities': self.extract_capabilities(content),
                'last_modified': datetime.fromtimestamp(file_path.stat().st_mtime),
                'content_hash': content_hash
            }
            
            # Store component
            component_id = content_hash
            self.components[component_id] = metadata
            
            # Extract capabilities
            for capability in metadata['capabilities']:
                self.capabilities[capability].append(component_id)
                
        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")
            
    def identify_component_type(self, content: str, filename: str) -> str:
        """Identify what type of component this is"""
        filename_lower = filename.lower()
        
        # Check filename patterns
        if 'launcher' in filename_lower:
            return 'launcher'
        elif 'monitor' in filename_lower:
            return 'monitor'
        elif 'game' in filename_lower:
            return 'game'
        elif 'chat' in filename_lower or 'log' in filename_lower:
            return 'chat_processor'
        elif 'ai' in filename_lower or 'llm' in filename_lower:
            return 'ai_service'
        elif 'auth' in filename_lower or 'oauth' in filename_lower:
            return 'authentication'
        elif 'api' in filename_lower or 'router' in filename_lower:
            return 'api'
        elif 'doc' in filename_lower:
            return 'documentation'
        elif 'test' in filename_lower:
            return 'test'
            
        # Check content patterns
        if 'HTTPServer' in content or 'BaseHTTPRequestHandler' in content:
            return 'web_service'
        elif 'WebSocket' in content or 'websockets' in content:
            return 'realtime_service'
        elif 'docker' in content or 'container' in content:
            return 'deployment'
        elif 'CREATE TABLE' in content or 'sqlite3' in content:
            return 'database_service'
            
        return 'utility'
        
    def extract_purpose(self, content: str) -> str:
        """Extract the purpose from docstrings or comments"""
        # Look for module docstring
        match = re.search(r'^"""(.*?)"""', content, re.DOTALL)
        if match:
            purpose = match.group(1).strip().split('\n')[0]
            return purpose[:200]  # First 200 chars
            
        # Look for first comment
        match = re.search(r'^#\s*(.+)$', content, re.MULTILINE)
        if match:
            return match.group(1)
            
        return "Unknown purpose"
        
    def extract_imports(self, content: str) -> List[str]:
        """Extract all imports"""
        imports = []
        
        # Standard imports
        for match in re.finditer(r'^import\s+(\S+)', content, re.MULTILINE):
            imports.append(match.group(1))
            
        # From imports
        for match in re.finditer(r'^from\s+(\S+)\s+import', content, re.MULTILINE):
            imports.append(match.group(1))
            
        return imports
        
    def extract_exports(self, content: str) -> List[str]:
        """Extract what this module exports"""
        exports = []
        
        # Classes
        for match in re.finditer(r'^class\s+(\w+)', content, re.MULTILINE):
            exports.append(f"class:{match.group(1)}")
            
        # Functions
        for match in re.finditer(r'^def\s+(\w+)', content, re.MULTILINE):
            if not match.group(1).startswith('_'):
                exports.append(f"function:{match.group(1)}")
                
        return exports
        
    def extract_ports(self, content: str) -> List[int]:
        """Extract port numbers"""
        ports = set()
        
        # Look for port assignments
        for match in re.finditer(r'port\s*=\s*(\d{4,5})', content, re.IGNORECASE):
            ports.add(int(match.group(1)))
            
        # Look for localhost URLs
        for match in re.finditer(r'localhost:(\d{4,5})', content):
            ports.add(int(match.group(1)))
            
        return list(ports)
        
    def extract_capabilities(self, content: str) -> List[str]:
        """Extract what this component can do"""
        capabilities = []
        
        # Based on imports and content
        if 'oauth' in content.lower():
            capabilities.append('authentication')
        if 'websocket' in content.lower():
            capabilities.append('realtime_communication')
        if 'chat' in content.lower() and 'log' in content.lower():
            capabilities.append('chat_processing')
        if 'qr' in content.lower() or 'qrcode' in content:
            capabilities.append('qr_generation')
        if 'docker' in content.lower():
            capabilities.append('containerization')
        if 'monitor' in content.lower():
            capabilities.append('monitoring')
        if 'game' in content.lower():
            capabilities.append('gaming')
        if 'ai' in content.lower() or 'llm' in content.lower():
            capabilities.append('ai_integration')
        if 'export' in content.lower():
            capabilities.append('data_export')
        if 'launch' in content.lower():
            capabilities.append('service_management')
            
        return capabilities
        
    def discover_relationships(self):
        """Discover how components relate to each other"""
        conn = sqlite3.connect(self.discovery_db)
        
        for comp_id, comp_data in self.components.items():
            # Check imports
            for imp in comp_data['imports']:
                # Find components that export this
                for other_id, other_data in self.components.items():
                    if comp_id != other_id:
                        for export in other_data['exports']:
                            if imp in export or imp in other_data['name']:
                                self.relationships[comp_id].add(other_id)
                                
                                conn.execute('''
                                    INSERT INTO relationships (from_component, to_component, relationship_type, strength)
                                    VALUES (?, ?, ?, ?)
                                ''', (comp_id, other_id, 'imports', 0.8))
                                
            # Check port connections
            for port in comp_data['ports']:
                for other_id, other_data in self.components.items():
                    if port in other_data['ports'] and comp_id != other_id:
                        self.relationships[comp_id].add(other_id)
                        
                        conn.execute('''
                            INSERT INTO relationships (from_component, to_component, relationship_type, strength)
                            VALUES (?, ?, ?, ?)
                        ''', (comp_id, other_id, 'shares_port', 0.5))
                        
        conn.commit()
        conn.close()
        
    def identify_patterns(self):
        """Identify patterns in the codebase"""
        conn = sqlite3.connect(self.discovery_db)
        
        # Pattern: Multiple launchers
        launchers = [c for c in self.components.values() if c['type'] == 'launcher']
        if len(launchers) > 3:
            conn.execute('''
                INSERT INTO patterns (pattern_type, pattern_data, frequency, components)
                VALUES (?, ?, ?, ?)
            ''', ('multiple_launchers', 'Too many launcher scripts', len(launchers), 
                  json.dumps([l['name'] for l in launchers])))
                  
        # Pattern: Duplicate functionality
        capability_groups = defaultdict(list)
        for cap, components in self.capabilities.items():
            if len(components) > 2:
                capability_groups[cap] = components
                
        for cap, comps in capability_groups.items():
            conn.execute('''
                INSERT INTO patterns (pattern_type, pattern_data, frequency, components)
                VALUES (?, ?, ?, ?)
            ''', ('duplicate_capability', f'Multiple components with {cap}', len(comps),
                  json.dumps(comps)))
                  
        conn.commit()
        conn.close()
        
    def save_discoveries(self):
        """Save all discoveries to database"""
        conn = sqlite3.connect(self.discovery_db)
        
        for comp_id, comp_data in self.components.items():
            conn.execute('''
                INSERT OR REPLACE INTO components 
                (id, name, type, path, purpose, imports, exports, ports, capabilities, last_modified, content_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (comp_id, comp_data['name'], comp_data['type'], comp_data['path'],
                  comp_data['purpose'], json.dumps(comp_data['imports']),
                  json.dumps(comp_data['exports']), json.dumps(comp_data['ports']),
                  json.dumps(comp_data['capabilities']), comp_data['last_modified'],
                  comp_data['content_hash']))
                  
        conn.commit()
        conn.close()
        
    def generate_discovery_report(self) -> Dict:
        """Generate a report of discoveries"""
        report = {
            'total_components': len(self.components),
            'component_types': defaultdict(int),
            'capabilities': dict(self.capabilities),
            'relationships': len(self.relationships),
            'patterns': [],
            'recommendations': []
        }
        
        # Count component types
        for comp in self.components.values():
            report['component_types'][comp['type']] += 1
            
        # Get patterns
        conn = sqlite3.connect(self.discovery_db)
        cursor = conn.execute('SELECT * FROM patterns')
        for row in cursor.fetchall():
            report['patterns'].append({
                'type': row[1],
                'description': row[2],
                'frequency': row[3],
                'components': json.loads(row[4])
            })
            
        # Generate recommendations
        report['recommendations'] = self.generate_recommendations(report)
        
        conn.close()
        return report

    def generate_recommendations(self, report: Dict) -> List[str]:
        """Generate intelligent recommendations"""
        recommendations = []
        
        # Check for multiple launchers
        if report['component_types']['launcher'] > 3:
            recommendations.append(
                f"Found {report['component_types']['launcher']} launcher scripts. "
                "Consider consolidating into one intelligent launcher."
            )
            
        # Check for missing capabilities
        essential_capabilities = [
            'authentication', 'monitoring', 'chat_processing', 
            'service_management', 'data_export'
        ]
        
        for cap in essential_capabilities:
            if cap not in report['capabilities']:
                recommendations.append(f"Missing capability: {cap}")
                
        # Check for duplicate capabilities
        for pattern in report['patterns']:
            if pattern['type'] == 'duplicate_capability':
                recommendations.append(
                    f"Found {pattern['frequency']} components with {pattern['description']}. "
                    "Consider consolidating."
                )
                
        return recommendations

class SelfAwareOrchestrator:
    """Uses discoveries to self-configure and predict needs"""
    
    def __init__(self, discovery: CodebaseDiscovery):
        self.discovery = discovery
        self.active_services = {}
        
    def predict_user_needs(self, context: Dict) -> List[Dict]:
        """Predict what the user needs before they ask"""
        predictions = []
        
        # If they're running chat processor, they'll need export
        if 'chat_processor' in context.get('active_services', []):
            if 'data_export' not in context.get('active_capabilities', []):
                predictions.append({
                    'need': 'data_export',
                    'reason': 'Chat processor is running but no export capability active',
                    'solution': self.find_component_with_capability('data_export')
                })
                
        # If they have multiple services, they need monitoring
        if len(context.get('active_services', [])) > 3:
            if 'monitoring' not in context.get('active_capabilities', []):
                predictions.append({
                    'need': 'monitoring',
                    'reason': 'Multiple services running without monitoring',
                    'solution': self.find_component_with_capability('monitoring')
                })
                
        return predictions
        
    def find_component_with_capability(self, capability: str) -> Optional[Dict]:
        """Find best component for a capability"""
        components = self.discovery.capabilities.get(capability, [])
        if components:
            # Return the first one (could be smarter)
            comp_id = components[0]
            return self.discovery.components.get(comp_id)
        return None
        
    def auto_configure_system(self) -> Dict:
        """Automatically configure system based on discoveries"""
        config = {
            'services_to_start': [],
            'connections_to_make': [],
            'settings_to_apply': {}
        }
        
        # Find the best launcher
        launchers = [c for c in self.discovery.components.values() 
                    if c['type'] == 'launcher']
        if launchers:
            # Pick the most recent one
            best_launcher = max(launchers, key=lambda x: x['last_modified'])
            config['services_to_start'].append(best_launcher)
            
        # Find essential services
        essential_types = ['monitor', 'chat_processor', 'authentication']
        for service_type in essential_types:
            services = [c for c in self.discovery.components.values() 
                       if c['type'] == service_type]
            if services:
                config['services_to_start'].append(services[0])
                
        return config

def create_self_aware_launcher():
    """Create the self-aware launcher"""
    launcher_content = '''#!/usr/bin/env python3
"""
SELF-AWARE LAUNCHER
Discovers what exists and launches intelligently
"""

from SOULFRA_SELF_AWARE_SYSTEM import CodebaseDiscovery, SelfAwareOrchestrator
import subprocess
import sys

def main():
    print("=" * 60)
    print("SOULFRA SELF-AWARE LAUNCHER")
    print("=" * 60)
    print()
    
    # Discover what we have
    print("Discovering existing components...")
    discovery = CodebaseDiscovery()
    report = discovery.discover_everything()
    
    print(f"\\nFound {report['total_components']} components:")
    for comp_type, count in report['component_types'].items():
        print(f"  - {comp_type}: {count}")
        
    print(f"\\nCapabilities available:")
    for cap, components in report['capabilities'].items():
        print(f"  - {cap}: {len(components)} components")
        
    # Self-configure
    print("\\nSelf-configuring system...")
    orchestrator = SelfAwareOrchestrator(discovery)
    config = orchestrator.auto_configure_system()
    
    print(f"\\nStarting {len(config['services_to_start'])} services:")
    for service in config['services_to_start']:
        print(f"  - {service['name']} ({service['purpose'][:50]}...)")
        
        # Start the service
        try:
            subprocess.Popen([
                sys.executable, service['path']
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"    ✓ Started on ports: {service['ports']}")
        except:
            print(f"    ✗ Failed to start")
            
    print("\\nRecommendations:")
    for rec in report['recommendations']:
        print(f"  - {rec}")
        
    print("\\nSystem is self-aware and running!")

if __name__ == "__main__":
    main()
'''
    
    with open('SELF_AWARE_LAUNCHER.py', 'w') as f:
        f.write(launcher_content)
    os.chmod('SELF_AWARE_LAUNCHER.py', 0o755)
    
    print("Created SELF_AWARE_LAUNCHER.py")

if __name__ == "__main__":
    print("=" * 60)
    print("SOULFRA SELF-AWARE SYSTEM")
    print("=" * 60)
    print()
    
    # Run discovery
    discovery = CodebaseDiscovery()
    report = discovery.discover_everything()
    
    print(f"\nDiscovered {report['total_components']} components")
    print("\nComponent types:")
    for comp_type, count in report['component_types'].items():
        print(f"  {comp_type}: {count}")
        
    print("\nPatterns found:")
    for pattern in report['patterns']:
        print(f"  - {pattern['description']}")
        
    print("\nRecommendations:")
    for rec in report['recommendations']:
        print(f"  - {rec}")
        
    # Create self-aware launcher
    create_self_aware_launcher()
    
    print("\nThe system is now self-aware!")
    print("Run: python3 SELF_AWARE_LAUNCHER.py")
    print("\nIt will discover and use what already exists!")