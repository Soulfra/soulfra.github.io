#!/usr/bin/env python3
"""
UNIFIED CLI INTEGRATION - Connects Claude Code, Codex CLI, and all local services
- Orchestrates Claude Code for actual code generation
- Integrates Codex CLI for additional AI capabilities  
- Coordinates all running services (ports 3030, 4000, 5555, 6969, 7777, 8080, 9090)
- Enables AI economy to function with real CLI tools
- Creates unified command interface for everything
"""

import os
import json
import time
import subprocess
import threading
import sqlite3
import uuid
import signal
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

class UnifiedCLIIntegration:
    """Master integration layer connecting all AI tools and services"""
    
    def __init__(self):
        self.port = 3030  # Master control port
        self.init_integration_database()
        self.service_registry = self.init_service_registry()
        self.claude_code_process = None
        self.codex_process = None
        self.active_services = {}
        self.command_history = []
        self.ai_collaboration_active = False
        
    def init_integration_database(self):
        """Master database for unified CLI integration"""
        self.conn = sqlite3.connect('unified_cli_integration.db', check_same_thread=False)
        
        # Service registry and health monitoring
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS service_registry (
                service_id TEXT PRIMARY KEY,
                service_name TEXT,
                service_type TEXT,  -- claude_code, codex, analyzer, assistant, economy, addiction
                port INTEGER,
                status TEXT,  -- starting, running, stopped, error
                health_check_url TEXT,
                start_command TEXT,
                dependencies TEXT,
                last_health_check DATETIME,
                uptime_seconds INTEGER DEFAULT 0
            )
        ''')
        
        # CLI command orchestration
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS cli_commands (
                id TEXT PRIMARY KEY,
                command_type TEXT,  -- claude_code, codex, unified, system
                original_command TEXT,
                routed_to_service TEXT,
                execution_result TEXT,
                success BOOLEAN,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                execution_time_ms INTEGER
            )
        ''')
        
        # AI collaboration sessions
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS ai_collaborations (
                session_id TEXT PRIMARY KEY,
                participating_ais TEXT,  -- JSON list of AI services
                collaboration_type TEXT,  -- code_generation, problem_solving, analysis
                shared_context TEXT,
                results TEXT,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME,
                success_rate REAL
            )
        ''')
        
        # Unified workflow automation
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS workflow_automations (
                workflow_id TEXT PRIMARY KEY,
                workflow_name TEXT,
                trigger_condition TEXT,
                service_sequence TEXT,  -- JSON array of service calls
                success_criteria TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                executions_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0
            )
        ''')
        
        self.conn.commit()
    
    def init_service_registry(self):
        """Initialize registry of all services with their configurations"""
        services = {
            'claude_code': {
                'name': 'Claude Code CLI',
                'type': 'claude_code',
                'port': None,  # CLI tool, no port
                'health_check': 'claude-code --version',
                'start_command': None,  # User-invoked CLI
                'dependencies': []
            },
            'codex_cli': {
                'name': 'Codex CLI',
                'type': 'codex',
                'port': None,  # CLI tool, no port
                'health_check': 'codex --version',
                'start_command': None,  # User-invoked CLI
                'dependencies': []
            },
            'smart_analyzer': {
                'name': 'Smart Codebase Analyzer',
                'type': 'analyzer',
                'port': 6969,
                'health_check': 'http://localhost:6969/health',
                'start_command': 'python SMART_CODEBASE_ANALYZER.py',
                'dependencies': []
            },
            'automated_assistant': {
                'name': 'Automated Code Assistant',
                'type': 'assistant',
                'port': 8080,
                'health_check': 'http://localhost:8080/health',
                'start_command': 'python AUTOMATED_CODE_ASSISTANT.py',
                'dependencies': ['smart_analyzer']
            },
            'ai_economy': {
                'name': 'AI Economy GitHub Automation',
                'type': 'economy',
                'port': 9090,
                'health_check': 'http://localhost:9090/health',
                'start_command': 'python AI_ECONOMY_GITHUB_AUTOMATION.py',
                'dependencies': ['automated_assistant']
            },
            'addiction_engine': {
                'name': 'Addiction Engine Platform',
                'type': 'addiction',
                'port': 7777,
                'health_check': 'http://localhost:7777/health',
                'start_command': 'python ADDICTION_ENGINE.py',
                'dependencies': []
            },
            'claude_integration': {
                'name': 'Claude Code Integration',
                'type': 'integration',
                'port': None,  # Background service
                'health_check': None,
                'start_command': 'python CLAUDE_CODE_INTEGRATION.py',
                'dependencies': ['automated_assistant']
            },
            'empathy_engine': {
                'name': 'Synthetic Empathy Engine',
                'type': 'empathy',
                'port': 5555,
                'health_check': 'http://localhost:5555/health',
                'start_command': 'python SYNTHETIC_EMPATHY_ENGINE.py',
                'dependencies': []
            },
            'production_platform': {
                'name': 'Production Ready Platform',
                'type': 'platform',
                'port': 4000,
                'health_check': 'http://localhost:4000/health',
                'start_command': 'python PRODUCTION_READY.py',
                'dependencies': ['smart_analyzer', 'automated_assistant']
            }
        }
        
        # Register services in database
        for service_id, config in services.items():
            self.conn.execute('''
                INSERT OR REPLACE INTO service_registry 
                (service_id, service_name, service_type, port, status, health_check_url, start_command, dependencies)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (service_id, config['name'], config['type'], config['port'], 'stopped', 
                  config['health_check'], config['start_command'], json.dumps(config['dependencies'])))
        
        self.conn.commit()
        return services
    
    def check_cli_tool_availability(self, tool_name):
        """Check if CLI tool is available"""
        try:
            if tool_name == 'claude_code':
                result = subprocess.run(['claude-code', '--version'], 
                                      capture_output=True, text=True, timeout=5)
                return result.returncode == 0
            elif tool_name == 'codex':
                # Check for common codex CLI names
                for cmd in ['codex', 'openai', 'openai-codex']:
                    try:
                        result = subprocess.run([cmd, '--version'], 
                                              capture_output=True, text=True, timeout=5)
                        if result.returncode == 0:
                            return True
                    except:
                        continue
                return False
            return False
        except:
            return False
    
    def start_service(self, service_id):
        """Start a specific service"""
        service = self.service_registry.get(service_id)
        if not service or not service['start_command']:
            return False
        
        try:
            # Check dependencies first
            dependencies = json.loads(self.conn.execute(
                'SELECT dependencies FROM service_registry WHERE service_id = ?', 
                (service_id,)).fetchone()[0])
            
            for dep in dependencies:
                if not self.is_service_running(dep):
                    print(f"⚠️  Starting dependency: {dep}")
                    self.start_service(dep)
                    time.sleep(2)  # Give dependency time to start
            
            # Start the service
            process = subprocess.Popen(
                service['start_command'].split(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.getcwd()
            )
            
            # Track the process
            self.active_services[service_id] = {
                'process': process,
                'started_at': datetime.now(),
                'config': service
            }
            
            # Update database
            self.conn.execute('''
                UPDATE service_registry 
                SET status = 'starting', last_health_check = ?
                WHERE service_id = ?
            ''', (datetime.now(), service_id))
            self.conn.commit()
            
            print(f"🚀 Starting {service['name']} on port {service['port']}")
            
            # Give service time to start
            time.sleep(3)
            
            # Verify it started
            if self.health_check_service(service_id):
                self.conn.execute('''
                    UPDATE service_registry 
                    SET status = 'running'
                    WHERE service_id = ?
                ''', (service_id,))
                self.conn.commit()
                return True
            else:
                print(f"⚠️  Service {service['name']} failed health check")
                return False
                
        except Exception as e:
            print(f"❌ Failed to start {service['name']}: {e}")
            self.conn.execute('''
                UPDATE service_registry 
                SET status = 'error'
                WHERE service_id = ?
            ''', (service_id,))
            self.conn.commit()
            return False
    
    def health_check_service(self, service_id):
        """Check if service is healthy"""
        service = self.service_registry.get(service_id)
        if not service:
            return False
        
        try:
            if service['port']:
                # HTTP health check
                import urllib.request
                url = f"http://localhost:{service['port']}/health"
                try:
                    response = urllib.request.urlopen(url, timeout=3)
                    return response.status == 200
                except:
                    # If no /health endpoint, just check if port is open
                    import socket
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    result = sock.connect_ex(('localhost', service['port']))
                    sock.close()
                    return result == 0
            else:
                # CLI tool or background service
                return service_id in self.active_services
        except:
            return False
    
    def is_service_running(self, service_id):
        """Check if service is currently running"""
        status = self.conn.execute(
            'SELECT status FROM service_registry WHERE service_id = ?', 
            (service_id,)).fetchone()
        return status and status[0] == 'running'
    
    def route_command(self, command, context=None):
        """Intelligently route commands to appropriate AI tools"""
        command_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Parse command to determine routing
        if command.startswith('claude-code') or 'claude code' in command.lower():
            result = self.execute_claude_code_command(command, context)
            routed_to = 'claude_code'
        elif command.startswith('codex') or 'codex' in command.lower():
            result = self.execute_codex_command(command, context)
            routed_to = 'codex'
        elif any(word in command.lower() for word in ['analyze', 'understand', 'explain']):
            result = self.route_to_analyzer(command, context)
            routed_to = 'smart_analyzer'
        elif any(word in command.lower() for word in ['improve', 'suggest', 'fix', 'refactor']):
            result = self.route_to_assistant(command, context)
            routed_to = 'automated_assistant'
        elif any(word in command.lower() for word in ['github', 'pr', 'pull request', 'economy']):
            result = self.route_to_economy(command, context)
            routed_to = 'ai_economy'
        else:
            # Default to collaborative approach
            result = self.collaborative_ai_response(command, context)
            routed_to = 'collaborative'
        
        # Log the command
        execution_time = int((time.time() - start_time) * 1000)
        self.conn.execute('''
            INSERT INTO cli_commands 
            (id, command_type, original_command, routed_to_service, execution_result, success, execution_time_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (command_id, 'unified', command, routed_to, str(result), 
              bool(result.get('success', False)), execution_time))
        self.conn.commit()
        
        return result
    
    def execute_claude_code_command(self, command, context=None):
        """Execute command using Claude Code CLI"""
        if not self.check_cli_tool_availability('claude_code'):
            return {
                'success': False,
                'error': 'Claude Code CLI not available. Install it first: https://claude.ai/code',
                'suggestion': 'Run: curl -sSL https://cli.anthropic.com/install.sh | bash'
            }
        
        try:
            # If it's a unified command, convert to Claude Code syntax
            if not command.startswith('claude-code'):
                command = f"claude-code {command}"
            
            # Add context if provided
            if context:
                command += f" --context '{json.dumps(context)}'"
            
            result = subprocess.run(
                command.split(),
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr,
                'command': command
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Claude Code command timed out after 60 seconds'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to execute Claude Code command: {e}'
            }
    
    def execute_codex_command(self, command, context=None):
        """Execute command using Codex CLI"""
        if not self.check_cli_tool_availability('codex'):
            return {
                'success': False,
                'error': 'Codex CLI not available. Install OpenAI CLI first',
                'suggestion': 'Run: pip install openai-cli'
            }
        
        try:
            # Convert to appropriate Codex command
            if not any(command.startswith(cmd) for cmd in ['codex', 'openai']):
                command = f"openai api completions.create -m code-davinci-002 -p '{command}'"
            
            result = subprocess.run(
                command.split(),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr,
                'command': command
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to execute Codex command: {e}'
            }
    
    def route_to_analyzer(self, command, context=None):
        """Route command to Smart Codebase Analyzer"""
        if not self.is_service_running('smart_analyzer'):
            self.start_service('smart_analyzer')
            time.sleep(2)
        
        try:
            import urllib.request
            import urllib.parse
            
            data = {
                'command': command,
                'context': context or {}
            }
            
            data_encoded = urllib.parse.urlencode({'data': json.dumps(data)}).encode()
            
            req = urllib.request.Request(
                'http://localhost:6969/analyze',
                data=data_encoded,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            response = urllib.request.urlopen(req, timeout=10)
            result = json.loads(response.read().decode())
            
            return {
                'success': True,
                'output': result,
                'service': 'smart_analyzer'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to route to analyzer: {e}',
                'fallback': 'Try starting the analyzer manually: python SMART_CODEBASE_ANALYZER.py'
            }
    
    def route_to_assistant(self, command, context=None):
        """Route command to Automated Code Assistant"""
        if not self.is_service_running('automated_assistant'):
            self.start_service('automated_assistant')
            time.sleep(2)
        
        try:
            import urllib.request
            import urllib.parse
            
            data = {
                'command': command,
                'context': context or {}
            }
            
            data_encoded = urllib.parse.urlencode({'data': json.dumps(data)}).encode()
            
            req = urllib.request.Request(
                'http://localhost:8080/assist',
                data=data_encoded,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            response = urllib.request.urlopen(req, timeout=15)
            result = json.loads(response.read().decode())
            
            return {
                'success': True,
                'output': result,
                'service': 'automated_assistant'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to route to assistant: {e}',
                'fallback': 'Try starting the assistant manually: python AUTOMATED_CODE_ASSISTANT.py'
            }
    
    def route_to_economy(self, command, context=None):
        """Route command to AI Economy GitHub Automation"""
        if not self.is_service_running('ai_economy'):
            self.start_service('ai_economy')
            time.sleep(2)
        
        try:
            import urllib.request
            import urllib.parse
            
            data = {
                'command': command,
                'context': context or {}
            }
            
            data_encoded = urllib.parse.urlencode({'data': json.dumps(data)}).encode()
            
            req = urllib.request.Request(
                'http://localhost:9090/economy',
                data=data_encoded,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            response = urllib.request.urlopen(req, timeout=20)
            result = json.loads(response.read().decode())
            
            return {
                'success': True,
                'output': result,
                'service': 'ai_economy'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to route to economy: {e}',
                'fallback': 'Try starting the economy manually: python AI_ECONOMY_GITHUB_AUTOMATION.py'
            }
    
    def collaborative_ai_response(self, command, context=None):
        """Use multiple AI services collaboratively"""
        session_id = str(uuid.uuid4())
        participating_ais = []
        results = {}
        
        try:
            # Start collaboration session
            self.conn.execute('''
                INSERT INTO ai_collaborations 
                (session_id, collaboration_type, shared_context)
                VALUES (?, ?, ?)
            ''', (session_id, 'multi_ai_response', json.dumps(context or {})))
            
            # Get insights from analyzer
            analyzer_result = self.route_to_analyzer(command, context)
            if analyzer_result.get('success'):
                participating_ais.append('smart_analyzer')
                results['analyzer'] = analyzer_result['output']
            
            # Get suggestions from assistant
            assistant_result = self.route_to_assistant(command, context)
            if assistant_result.get('success'):
                participating_ais.append('automated_assistant')
                results['assistant'] = assistant_result['output']
            
            # Use Claude Code if appropriate
            if any(word in command.lower() for word in ['write', 'create', 'implement', 'code']):
                claude_result = self.execute_claude_code_command(command, context)
                if claude_result.get('success'):
                    participating_ais.append('claude_code')
                    results['claude_code'] = claude_result['output']
            
            # Synthesize collaborative response
            collaborative_response = self.synthesize_ai_responses(results, command)
            
            # Update collaboration session
            self.conn.execute('''
                UPDATE ai_collaborations 
                SET participating_ais = ?, results = ?, ended_at = ?, success_rate = ?
                WHERE session_id = ?
            ''', (json.dumps(participating_ais), json.dumps(results), 
                  datetime.now(), len(results) / max(len(participating_ais), 1), session_id))
            self.conn.commit()
            
            return {
                'success': True,
                'output': collaborative_response,
                'participating_ais': participating_ais,
                'session_id': session_id
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Collaborative AI response failed: {e}',
                'partial_results': results
            }
    
    def synthesize_ai_responses(self, results, original_command):
        """Synthesize responses from multiple AI services"""
        synthesis = {
            'command': original_command,
            'timestamp': datetime.now().isoformat(),
            'ai_insights': {},
            'unified_response': '',
            'action_items': [],
            'confidence_score': 0.0
        }
        
        total_confidence = 0
        response_parts = []
        
        # Process analyzer insights
        if 'analyzer' in results:
            synthesis['ai_insights']['codebase_analysis'] = results['analyzer']
            response_parts.append("🔍 **Codebase Analysis:**")
            response_parts.append(str(results['analyzer']))
            total_confidence += 0.8
        
        # Process assistant suggestions
        if 'assistant' in results:
            synthesis['ai_insights']['improvement_suggestions'] = results['assistant']
            response_parts.append("💡 **Improvement Suggestions:**")
            response_parts.append(str(results['assistant']))
            total_confidence += 0.9
        
        # Process Claude Code output
        if 'claude_code' in results:
            synthesis['ai_insights']['code_generation'] = results['claude_code']
            response_parts.append("🤖 **Claude Code Output:**")
            response_parts.append(str(results['claude_code']))
            total_confidence += 1.0
        
        # Create unified response
        synthesis['unified_response'] = "\n\n".join(response_parts)
        synthesis['confidence_score'] = total_confidence / len(results) if results else 0.0
        
        # Generate action items
        if 'assistant' in results:
            synthesis['action_items'].append("Review automated suggestions and implement safely")
        if 'claude_code' in results:
            synthesis['action_items'].append("Integrate Claude Code generated code")
        if 'analyzer' in results:
            synthesis['action_items'].append("Address codebase complexity issues identified")
        
        return synthesis
    
    def start_all_services(self):
        """Start all services in dependency order"""
        print("🚀 Starting unified CLI integration ecosystem...")
        
        # Start services in dependency order
        service_order = [
            'smart_analyzer',
            'automated_assistant', 
            'claude_integration',
            'ai_economy',
            'addiction_engine',
            'empathy_engine',
            'production_platform'
        ]
        
        for service_id in service_order:
            if service_id in self.service_registry:
                print(f"📡 Starting {self.service_registry[service_id]['name']}...")
                success = self.start_service(service_id)
                if success:
                    print(f"✅ {self.service_registry[service_id]['name']} started successfully")
                else:
                    print(f"⚠️  Failed to start {self.service_registry[service_id]['name']}")
                time.sleep(1)
        
        print("\n🌐 Checking CLI tool availability...")
        claude_available = self.check_cli_tool_availability('claude_code')
        codex_available = self.check_cli_tool_availability('codex')
        
        print(f"🤖 Claude Code CLI: {'✅ Available' if claude_available else '❌ Not found'}")
        print(f"🧠 Codex CLI: {'✅ Available' if codex_available else '❌ Not found'}")
        
        return {
            'services_started': len([s for s in service_order if self.is_service_running(s)]),
            'claude_code_available': claude_available,
            'codex_available': codex_available
        }
    
    def stop_all_services(self):
        """Stop all running services"""
        print("🛑 Stopping all services...")
        
        for service_id, service_info in self.active_services.items():
            try:
                process = service_info['process']
                process.terminate()
                process.wait(timeout=5)
                print(f"✅ Stopped {service_info['config']['name']}")
            except:
                try:
                    process.kill()
                    print(f"🔥 Force killed {service_info['config']['name']}")
                except:
                    print(f"⚠️  Could not stop {service_info['config']['name']}")
        
        self.active_services.clear()
        
        # Update database
        self.conn.execute('UPDATE service_registry SET status = "stopped"')
        self.conn.commit()
    
    def get_ecosystem_status(self):
        """Get status of entire ecosystem"""
        services = self.conn.execute('''
            SELECT service_id, service_name, service_type, port, status, last_health_check
            FROM service_registry
        ''').fetchall()
        
        recent_commands = self.conn.execute('''
            SELECT command_type, routed_to_service, success, execution_time_ms, timestamp
            FROM cli_commands
            ORDER BY timestamp DESC
            LIMIT 10
        ''').fetchall()
        
        collaborations = self.conn.execute('''
            SELECT COUNT(*) as total, AVG(success_rate) as avg_success
            FROM ai_collaborations
            WHERE started_at > datetime('now', '-24 hours')
        ''').fetchone()
        
        return {
            'services': [{
                'id': row[0],
                'name': row[1],
                'type': row[2],
                'port': row[3],
                'status': row[4],
                'last_check': row[5]
            } for row in services],
            'recent_commands': [{
                'type': row[0],
                'service': row[1],
                'success': bool(row[2]),
                'time_ms': row[3],
                'timestamp': row[4]
            } for row in recent_commands],
            'collaboration_stats': {
                'total_today': collaborations[0],
                'avg_success_rate': collaborations[1] or 0
            },
            'claude_code_available': self.check_cli_tool_availability('claude_code'),
            'codex_available': self.check_cli_tool_availability('codex')
        }

class UnifiedCLIHandler(BaseHTTPRequestHandler):
    """HTTP handler for unified CLI web interface"""
    
    def do_GET(self):
        if self.path == '/':
            self.serve_dashboard()
        elif self.path == '/status':
            self.serve_status()
        elif self.path == '/health':
            self.serve_health()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/command':
            self.handle_command()
        else:
            self.send_response(404)
            self.end_headers()
    
    def serve_dashboard(self):
        """Serve unified CLI dashboard"""
        dashboard_html = '''
<!DOCTYPE html>
<html>
<head>
    <title>🚀 Unified CLI Integration Dashboard</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff00; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .service-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px; }
        .service-status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .status-running { background: #004400; color: #00ff00; }
        .status-stopped { background: #440000; color: #ff4444; }
        .command-interface { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; }
        .command-input { width: 100%; background: #000; border: 1px solid #333; color: #00ff00; padding: 10px; font-family: monospace; }
        .command-output { background: #000; border: 1px solid #333; color: #00ff00; padding: 10px; min-height: 200px; font-family: monospace; white-space: pre-wrap; }
        .ai-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .ai-tool { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px; text-align: center; }
        .available { border-color: #00ff00; }
        .unavailable { border-color: #ff4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 UNIFIED CLI INTEGRATION</h1>
            <h2>Claude Code + Codex + All Local Services</h2>
            <p>Master control center for the entire AI ecosystem</p>
        </div>
        
        <div class="ai-tools">
            <div class="ai-tool" id="claude-tool">
                <h3>🤖 Claude Code CLI</h3>
                <p id="claude-status">Checking...</p>
            </div>
            <div class="ai-tool" id="codex-tool">
                <h3>🧠 Codex CLI</h3>
                <p id="codex-status">Checking...</p>
            </div>
        </div>
        
        <div class="service-grid" id="services">
            <!-- Services loaded dynamically -->
        </div>
        
        <div class="command-interface">
            <h3>🎯 Unified Command Interface</h3>
            <p>Commands are automatically routed to the appropriate AI tool or service:</p>
            <ul>
                <li><code>claude-code create component</code> → Claude Code CLI</li>
                <li><code>analyze my codebase</code> → Smart Analyzer</li>
                <li><code>improve this file</code> → Automated Assistant</li>
                <li><code>create github pr</code> → AI Economy</li>
                <li><code>help me understand</code> → Collaborative AI</li>
            </ul>
            
            <input type="text" id="command-input" class="command-input" placeholder="Enter unified command..." />
            <button onclick="executeCommand()" style="margin-top: 10px; padding: 10px 20px; background: #004400; color: #00ff00; border: 1px solid #00ff00;">Execute</button>
            
            <h4>Output:</h4>
            <div id="command-output" class="command-output">Ready for commands...</div>
        </div>
    </div>
    
    <script>
        async function loadStatus() {
            try {
                const response = await fetch('/status');
                const status = await response.json();
                
                // Update AI tools status
                const claudeTool = document.getElementById('claude-tool');
                const codexTool = document.getElementById('codex-tool');
                
                claudeTool.className = 'ai-tool ' + (status.claude_code_available ? 'available' : 'unavailable');
                document.getElementById('claude-status').textContent = status.claude_code_available ? '✅ Available' : '❌ Not found';
                
                codexTool.className = 'ai-tool ' + (status.codex_available ? 'available' : 'unavailable');
                document.getElementById('codex-status').textContent = status.codex_available ? '✅ Available' : '❌ Not found';
                
                // Update services
                const servicesDiv = document.getElementById('services');
                servicesDiv.innerHTML = '';
                
                status.services.forEach(service => {
                    const serviceCard = document.createElement('div');
                    serviceCard.className = 'service-card';
                    serviceCard.innerHTML = `
                        <h4>${service.name}</h4>
                        <p>Type: ${service.type} | Port: ${service.port || 'N/A'}</p>
                        <span class="service-status status-${service.status}">${service.status.toUpperCase()}</span>
                        <p style="font-size: 12px; margin-top: 10px;">Last check: ${service.last_check || 'Never'}</p>
                    `;
                    servicesDiv.appendChild(serviceCard);
                });
                
            } catch (error) {
                console.error('Failed to load status:', error);
            }
        }
        
        async function executeCommand() {
            const input = document.getElementById('command-input');
            const output = document.getElementById('command-output');
            const command = input.value.trim();
            
            if (!command) return;
            
            output.textContent = 'Executing command...\\n';
            
            try {
                const response = await fetch('/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `command=${encodeURIComponent(command)}`
                });
                
                const result = await response.json();
                output.textContent = `Command: ${command}\\n\\n` + JSON.stringify(result, null, 2);
                
            } catch (error) {
                output.textContent = `Error executing command: ${error}`;
            }
            
            input.value = '';
        }
        
        // Allow Enter key to execute command
        document.getElementById('command-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                executeCommand();
            }
        });
        
        // Load initial status
        loadStatus();
        
        // Refresh status every 10 seconds
        setInterval(loadStatus, 10000);
    </script>
</body>
</html>
        '''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(dashboard_html.encode())
    
    def serve_status(self):
        """Serve ecosystem status as JSON"""
        status = self.server.integration.get_ecosystem_status()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())
    
    def serve_health(self):
        """Health check endpoint"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'healthy'}).encode())
    
    def handle_command(self):
        """Handle unified command execution"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        from urllib.parse import parse_qs
        params = parse_qs(post_data)
        command = params.get('command', [''])[0]
        
        if command:
            result = self.server.integration.route_command(command)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'No command provided'}).encode())

def run_unified_cli_integration():
    """Run the unified CLI integration system"""
    integration = UnifiedCLIIntegration()
    
    print(f"""
🚀🤖🚀 UNIFIED CLI INTEGRATION LAUNCHED! 🚀🤖🚀

🌐 MASTER CONTROL: http://localhost:3030

✅ CLAUDE CODE INTEGRATION:
   - Intelligent command routing to Claude Code CLI
   - Context-aware code generation
   - Real-time collaboration with local services
   - Unified command interface

✅ CODEX CLI INTEGRATION:
   - OpenAI Codex command support
   - Multi-AI collaboration capabilities
   - Intelligent tool selection
   - Cross-platform compatibility

✅ LOCAL SERVICES ORCHESTRATION:
   - Smart Codebase Analyzer (port 6969)
   - Automated Code Assistant (port 8080)
   - AI Economy GitHub Automation (port 9090)
   - Addiction Engine Platform (port 7777)
   - Synthetic Empathy Engine (port 5555)
   - Production Ready Platform (port 4000)

✅ UNIFIED FEATURES:
   - Automatic service discovery and health monitoring
   - Collaborative AI responses using multiple tools
   - Command history and analytics
   - Web dashboard for ecosystem management
   - Dependency-aware service startup

Ready to orchestrate the entire AI ecosystem! 🎯
""")
    
    # Start all services
    startup_result = integration.start_all_services()
    
    print(f"\n📊 ECOSYSTEM STATUS:")
    print(f"   Services started: {startup_result['services_started']}")
    print(f"   Claude Code available: {startup_result['claude_code_available']}")
    print(f"   Codex available: {startup_result['codex_available']}")
    
    # Setup signal handler for graceful shutdown
    def signal_handler(sig, frame):
        print("\n🛑 Shutting down unified CLI integration...")
        integration.stop_all_services()
        os._exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start HTTP server
    try:
        server = HTTPServer(('localhost', integration.port), UnifiedCLIHandler)
        server.integration = integration
        
        print(f"\n🎯 Unified CLI Integration ready at http://localhost:{integration.port}")
        print("💡 Use the web interface or route commands programmatically")
        print("🔄 All AI tools and services are now connected and orchestrated")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🔄 Unified CLI integration stopped")
        integration.stop_all_services()

if __name__ == '__main__':
    run_unified_cli_integration()