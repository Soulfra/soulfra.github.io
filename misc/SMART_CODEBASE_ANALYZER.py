#!/usr/bin/env python3
"""
SMART CODEBASE ANALYZER - Actually understand the user's code and give intelligent responses
No more generic bullshit - this analyzes YOUR specific codebase and gives YOU smart answers
"""

import os
import json
import time
import ast
import re
import sqlite3
from collections import defaultdict, Counter
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

class SmartCodebaseAnalyzer:
    """Actually smart codebase analysis that understands YOUR code"""
    
    def __init__(self):
        self.port = 6969  # Nice port for smart analysis
        self.codebase_map = {}
        self.function_dependencies = {}
        self.class_relationships = {}
        self.file_patterns = {}
        self.recent_changes = []
        self.user_patterns = {}
        self.smart_suggestions = []
        self.init_smart_database()
        
    def init_smart_database(self):
        """Database that actually learns from the codebase"""
        self.conn = sqlite3.connect('smart_codebase.db', check_same_thread=False)
        
        # Files and their actual content analysis
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS codebase_files (
                id INTEGER PRIMARY KEY,
                file_path TEXT UNIQUE,
                file_type TEXT,
                lines_of_code INTEGER,
                complexity_score INTEGER,
                last_modified DATETIME,
                imports TEXT,
                functions TEXT,
                classes TEXT,
                patterns TEXT,
                purpose TEXT,
                dependencies TEXT
            )
        ''')
        
        # Function analysis - what they actually do
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS functions (
                id INTEGER PRIMARY KEY,
                file_path TEXT,
                function_name TEXT,
                line_number INTEGER,
                complexity INTEGER,
                parameters TEXT,
                return_type TEXT,
                docstring TEXT,
                calls_functions TEXT,
                purpose TEXT,
                usage_pattern TEXT
            )
        ''')
        
        # Class analysis - actual relationships
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY,
                file_path TEXT,
                class_name TEXT,
                line_number INTEGER,
                inheritance TEXT,
                methods TEXT,
                properties TEXT,
                purpose TEXT,
                usage_examples TEXT
            )
        ''')
        
        # User interaction patterns
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS user_interactions (
                id INTEGER PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_input TEXT,
                context_files TEXT,
                smart_response TEXT,
                user_feedback TEXT,
                was_helpful BOOLEAN
            )
        ''')
        
        # Smart suggestions based on actual code
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS smart_suggestions (
                id INTEGER PRIMARY KEY,
                suggestion_type TEXT,
                context TEXT,
                suggestion TEXT,
                confidence_score REAL,
                based_on_files TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.commit()
    
    def analyze_entire_codebase(self, root_path="."):
        """Actually analyze the user's codebase intelligently"""
        print(f"🧠 ANALYZING YOUR CODEBASE: {os.path.abspath(root_path)}")
        
        analysis_results = {
            "total_files": 0,
            "python_files": 0,
            "javascript_files": 0,
            "total_functions": 0,
            "total_classes": 0,
            "architecture_patterns": [],
            "main_purposes": [],
            "dependencies": [],
            "complexity_hotspots": [],
            "improvement_suggestions": []
        }
        
        for root, dirs, files in os.walk(root_path):
            # Skip hidden directories and common ignore patterns
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'venv']]
            
            for file in files:
                if file.startswith('.'):
                    continue
                    
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, root_path)
                
                analysis_results["total_files"] += 1
                
                # Analyze based on file type
                if file.endswith('.py'):
                    self.analyze_python_file(file_path, relative_path)
                    analysis_results["python_files"] += 1
                elif file.endswith(('.js', '.ts', '.jsx', '.tsx')):
                    self.analyze_javascript_file(file_path, relative_path)
                    analysis_results["javascript_files"] += 1
                elif file.endswith(('.md', '.txt', '.json')):
                    self.analyze_text_file(file_path, relative_path)
        
        # Generate intelligent insights
        insights = self.generate_codebase_insights()
        analysis_results.update(insights)
        
        print(f"✅ ANALYSIS COMPLETE:")
        print(f"   📁 {analysis_results['total_files']} files analyzed")
        print(f"   🐍 {analysis_results['python_files']} Python files")
        print(f"   📜 {analysis_results['javascript_files']} JS/TS files")
        print(f"   🔧 {len(analysis_results['main_purposes'])} main purposes identified")
        
        return analysis_results
    
    def analyze_python_file(self, file_path, relative_path):
        """Deep analysis of Python files"""
        try:
            content = safe_read_text(file_path)
            
            # Parse the AST to understand structure
            try:
                tree = ast.parse(content)
                
                functions = []
                classes = []
                imports = []
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        func_info = {
                            "name": node.name,
                            "line": node.lineno,
                            "args": [arg.arg for arg in node.args.args],
                            "docstring": ast.get_docstring(node) or "",
                            "complexity": self.calculate_complexity(node)
                        }
                        functions.append(func_info)
                    
                    elif isinstance(node, ast.ClassDef):
                        class_info = {
                            "name": node.name,
                            "line": node.lineno,
                            "bases": [base.id if hasattr(base, 'id') else str(base) for base in node.bases],
                            "methods": [n.name for n in node.body if isinstance(n, ast.FunctionDef)],
                            "docstring": ast.get_docstring(node) or ""
                        }
                        classes.append(class_info)
                    
                    elif isinstance(node, ast.Import):
                        for alias in node.names:
                            imports.append(alias.name)
                    
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            for alias in node.names:
                                imports.append(f"{node.module}.{alias.name}")
                
                # Determine file purpose
                purpose = self.determine_file_purpose(relative_path, content, functions, classes)
                
                # Store in database
                self.conn.execute('''
                    INSERT OR REPLACE INTO codebase_files 
                    (file_path, file_type, lines_of_code, complexity_score, last_modified, 
                     imports, functions, classes, purpose)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (relative_path, 'python', len(content.split('\n')), 
                      sum(f['complexity'] for f in functions),
                      datetime.now(), json.dumps(imports), 
                      json.dumps(functions), json.dumps(classes), purpose))
                
                # Store functions
                for func in functions:
                    self.conn.execute('''
                        INSERT OR REPLACE INTO functions 
                        (file_path, function_name, line_number, complexity, parameters, docstring, purpose)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (relative_path, func['name'], func['line'], func['complexity'],
                          json.dumps(func['args']), func['docstring'], 
                          self.determine_function_purpose(func['name'], func['docstring'])))
                
                # Store classes
                for cls in classes:
                    self.conn.execute('''
                        INSERT OR REPLACE INTO classes 
                        (file_path, class_name, line_number, inheritance, methods, purpose)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (relative_path, cls['name'], cls['line'], 
                          json.dumps(cls['bases']), json.dumps(cls['methods']),
                          self.determine_class_purpose(cls['name'], cls['docstring'])))
                
                self.conn.commit()
                
            except SyntaxError as e:
                print(f"⚠️  Syntax error in {relative_path}: {e}")
                
        except Exception as e:
            print(f"⚠️  Error analyzing {relative_path}: {e}")
    
    def analyze_javascript_file(self, file_path, relative_path):
        """Analyze JavaScript/TypeScript files"""
        try:
            content = safe_read_text(file_path)
            
            # Extract functions using regex (simple but effective)
            function_pattern = r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|function))'
            functions = re.findall(function_pattern, content)
            function_names = [f[0] or f[1] for f in functions]
            
            # Extract imports
            import_pattern = r'import\s+.*?from\s+[\'"]([^\'"]+)[\'"]'
            imports = re.findall(import_pattern, content)
            
            # Determine purpose
            purpose = self.determine_file_purpose(relative_path, content, function_names, [])
            
            # Store in database
            self.conn.execute('''
                INSERT OR REPLACE INTO codebase_files 
                (file_path, file_type, lines_of_code, imports, functions, purpose)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (relative_path, 'javascript', len(content.split('\n')), 
                  json.dumps(imports), json.dumps(function_names), purpose))
            
            self.conn.commit()
            
        except Exception as e:
            print(f"⚠️  Error analyzing {relative_path}: {e}")
    
    def analyze_text_file(self, file_path, relative_path):
        """Analyze documentation and config files"""
        try:
            content = safe_read_text(file_path)
            
            purpose = "documentation"
            if file_path.endswith('.json'):
                purpose = "configuration"
            elif 'README' in file_path.upper():
                purpose = "project_documentation"
            elif 'CLAUDE.md' in file_path:
                purpose = "ai_instructions"
            
            self.conn.execute('''
                INSERT OR REPLACE INTO codebase_files 
                (file_path, file_type, lines_of_code, purpose)
                VALUES (?, ?, ?, ?)
            ''', (relative_path, 'text', len(content.split('\n')), purpose))
            
            self.conn.commit()
            
        except Exception as e:
            print(f"⚠️  Error analyzing {relative_path}: {e}")
    
    def calculate_complexity(self, node):
        """Calculate cyclomatic complexity of a function"""
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.Try, ast.With)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        
        return complexity
    
    def determine_file_purpose(self, file_path, content, functions, classes):
        """Intelligently determine what a file does"""
        file_name = os.path.basename(file_path).lower()
        
        # Pattern-based detection
        if 'test' in file_name:
            return "testing"
        elif 'server' in file_name or 'http' in content.lower():
            return "web_server"
        elif 'database' in file_name or 'sqlite' in content.lower():
            return "database_operations"
        elif 'api' in file_name or 'endpoint' in content.lower():
            return "api_interface"
        elif 'config' in file_name or 'setting' in file_name:
            return "configuration"
        elif 'util' in file_name or 'helper' in file_name:
            return "utilities"
        elif 'engine' in file_name:
            return "core_logic"
        elif 'standard' in file_name:
            return "framework_definition"
        elif 'rule' in file_name:
            return "validation_rules"
        elif 'addiction' in file_name:
            return "user_engagement"
        elif 'multimodal' in file_name:
            return "input_processing"
        elif len(classes) > 0:
            return "class_definitions"
        elif len(functions) > 5:
            return "function_library"
        else:
            return "general_logic"
    
    def determine_function_purpose(self, func_name, docstring):
        """Determine what a function actually does"""
        name_lower = func_name.lower()
        
        if name_lower.startswith(('get_', 'fetch_', 'load_', 'read_')):
            return "data_retrieval"
        elif name_lower.startswith(('set_', 'save_', 'write_', 'store_')):
            return "data_storage"
        elif name_lower.startswith(('process_', 'handle_', 'execute_')):
            return "data_processing"
        elif name_lower.startswith(('validate_', 'check_', 'verify_')):
            return "validation"
        elif name_lower.startswith(('create_', 'generate_', 'build_')):
            return "creation"
        elif name_lower.startswith(('update_', 'modify_', 'change_')):
            return "modification"
        elif name_lower.startswith(('delete_', 'remove_', 'clear_')):
            return "deletion"
        elif 'test' in name_lower:
            return "testing"
        elif 'init' in name_lower or 'setup' in name_lower:
            return "initialization"
        else:
            return "general_operation"
    
    def determine_class_purpose(self, class_name, docstring):
        """Determine what a class represents"""
        name_lower = class_name.lower()
        
        if 'handler' in name_lower:
            return "request_handling"
        elif 'engine' in name_lower:
            return "core_system"
        elif 'analyzer' in name_lower:
            return "analysis_tool"
        elif 'system' in name_lower:
            return "system_component"
        elif 'rule' in name_lower:
            return "rule_enforcement"
        elif 'server' in name_lower:
            return "server_component"
        else:
            return "data_structure"
    
    def generate_codebase_insights(self):
        """Generate intelligent insights about the codebase"""
        insights = {
            "main_purposes": [],
            "architecture_patterns": [],
            "dependencies": [],
            "complexity_hotspots": [],
            "improvement_suggestions": []
        }
        
        # Get file purposes
        purposes = self.conn.execute('''
            SELECT purpose, COUNT(*) as count 
            FROM codebase_files 
            GROUP BY purpose 
            ORDER BY count DESC
        ''').fetchall()
        
        insights["main_purposes"] = [{"purpose": p[0], "count": p[1]} for p in purposes]
        
        # Get complexity hotspots
        hotspots = self.conn.execute('''
            SELECT file_path, complexity_score 
            FROM codebase_files 
            WHERE complexity_score > 10 
            ORDER BY complexity_score DESC
        ''').fetchall()
        
        insights["complexity_hotspots"] = [{"file": h[0], "complexity": h[1]} for h in hotspots]
        
        # Architecture patterns
        patterns = []
        if any("web_server" in p["purpose"] for p in insights["main_purposes"]):
            patterns.append("web_application")
        if any("database" in p["purpose"] for p in insights["main_purposes"]):
            patterns.append("data_persistence")
        if any("api" in p["purpose"] for p in insights["main_purposes"]):
            patterns.append("api_architecture")
        if any("engine" in p["purpose"] for p in insights["main_purposes"]):
            patterns.append("engine_pattern")
        
        insights["architecture_patterns"] = patterns
        
        return insights
    
    def get_smart_response(self, user_input):
        """Generate intelligent response based on actual codebase knowledge"""
        user_input_lower = user_input.lower()
        
        # Determine what the user is asking about
        if any(word in user_input_lower for word in ['function', 'def', 'method']):
            return self.respond_about_functions(user_input)
        elif any(word in user_input_lower for word in ['class', 'object']):
            return self.respond_about_classes(user_input)
        elif any(word in user_input_lower for word in ['file', 'module']):
            return self.respond_about_files(user_input)
        elif any(word in user_input_lower for word in ['architecture', 'structure', 'pattern']):
            return self.respond_about_architecture(user_input)
        elif any(word in user_input_lower for word in ['improve', 'optimize', 'fix']):
            return self.respond_about_improvements(user_input)
        elif any(word in user_input_lower for word in ['what does', 'how does', 'explain']):
            return self.respond_about_explanation(user_input)
        else:
            return self.respond_general_codebase(user_input)
    
    def respond_about_functions(self, user_input):
        """Smart response about functions in the codebase"""
        functions = self.conn.execute('''
            SELECT file_path, function_name, purpose, complexity, parameters 
            FROM functions 
            ORDER BY complexity DESC 
            LIMIT 10
        ''').fetchall()
        
        if not functions:
            return "I haven't found any functions in your codebase yet. Run the analyzer first!"
        
        response = f"🔧 **FUNCTIONS IN YOUR CODEBASE:**\n\n"
        
        # Most complex functions
        response += f"**Most Complex Functions:**\n"
        for func in functions[:5]:
            response += f"- `{func[1]}()` in {func[0]} (complexity: {func[3]}) - {func[2]}\n"
        
        # Function purposes breakdown
        purposes = self.conn.execute('''
            SELECT purpose, COUNT(*) as count 
            FROM functions 
            GROUP BY purpose 
            ORDER BY count DESC
        ''').fetchall()
        
        response += f"\n**Function Types:**\n"
        for purpose, count in purposes:
            response += f"- {purpose.replace('_', ' ').title()}: {count} functions\n"
        
        return response
    
    def respond_about_classes(self, user_input):
        """Smart response about classes in the codebase"""
        classes = self.conn.execute('''
            SELECT file_path, class_name, purpose, methods 
            FROM classes 
            ORDER BY class_name
        ''').fetchall()
        
        if not classes:
            return "No classes found in your codebase. You might be using a functional programming style."
        
        response = f"🏗️ **CLASSES IN YOUR CODEBASE:**\n\n"
        
        for cls in classes:
            methods = json.loads(cls[3]) if cls[3] else []
            response += f"**{cls[1]}** ({cls[0]})\n"
            response += f"- Purpose: {cls[2].replace('_', ' ').title()}\n"
            response += f"- Methods: {', '.join(methods[:5])}\n"
            if len(methods) > 5:
                response += f"- ... and {len(methods) - 5} more methods\n"
            response += "\n"
        
        return response
    
    def respond_about_files(self, user_input):
        """Smart response about file structure"""
        files = self.conn.execute('''
            SELECT file_path, file_type, purpose, lines_of_code 
            FROM codebase_files 
            ORDER BY lines_of_code DESC
        ''').fetchall()
        
        if not files:
            return "No files analyzed yet. Let me scan your codebase first!"
        
        response = f"📁 **YOUR CODEBASE STRUCTURE:**\n\n"
        
        # File breakdown by type
        file_types = {}
        purposes = {}
        total_lines = 0
        
        for file_path, file_type, purpose, lines in files:
            file_types[file_type] = file_types.get(file_type, 0) + 1
            purposes[purpose] = purposes.get(purpose, 0) + 1
            total_lines += lines or 0
        
        response += f"**Summary:**\n"
        response += f"- Total files: {len(files)}\n"
        response += f"- Total lines: {total_lines:,}\n"
        response += f"- Average file size: {total_lines // len(files) if files else 0} lines\n\n"
        
        response += f"**File Types:**\n"
        for file_type, count in sorted(file_types.items()):
            response += f"- {file_type.title()}: {count} files\n"
        
        response += f"\n**Main Purposes:**\n"
        for purpose, count in sorted(purposes.items(), key=lambda x: x[1], reverse=True):
            response += f"- {purpose.replace('_', ' ').title()}: {count} files\n"
        
        response += f"\n**Largest Files:**\n"
        for file_path, _, purpose, lines in files[:5]:
            response += f"- {file_path} ({lines} lines) - {purpose.replace('_', ' ').title()}\n"
        
        return response
    
    def respond_about_architecture(self, user_input):
        """Smart response about codebase architecture"""
        insights = self.generate_codebase_insights()
        
        response = f"🏛️ **YOUR CODEBASE ARCHITECTURE:**\n\n"
        
        if insights["architecture_patterns"]:
            response += f"**Detected Patterns:**\n"
            for pattern in insights["architecture_patterns"]:
                response += f"- {pattern.replace('_', ' ').title()}\n"
        
        response += f"\n**Component Breakdown:**\n"
        for purpose_info in insights["main_purposes"]:
            response += f"- {purpose_info['purpose'].replace('_', ' ').title()}: {purpose_info['count']} files\n"
        
        if insights["complexity_hotspots"]:
            response += f"\n**Complexity Hotspots:**\n"
            for hotspot in insights["complexity_hotspots"][:3]:
                response += f"- {hotspot['file']} (complexity: {hotspot['complexity']})\n"
        
        # Architecture suggestions
        response += f"\n**Architecture Analysis:**\n"
        if any("web_server" in p["purpose"] for p in insights["main_purposes"]):
            response += "- ✅ Web server architecture detected\n"
        if any("database" in p["purpose"] for p in insights["main_purposes"]):
            response += "- ✅ Database layer implemented\n"
        if any("api" in p["purpose"] for p in insights["main_purposes"]):
            response += "- ✅ API interfaces defined\n"
        
        return response
    
    def respond_about_improvements(self, user_input):
        """Smart suggestions for improvements"""
        insights = self.generate_codebase_insights()
        
        response = f"🚀 **IMPROVEMENT SUGGESTIONS FOR YOUR CODEBASE:**\n\n"
        
        suggestions = []
        
        # Complexity-based suggestions
        if insights["complexity_hotspots"]:
            suggestions.append(f"**Reduce Complexity:** Consider refactoring these complex files:")
            for hotspot in insights["complexity_hotspots"][:3]:
                suggestions.append(f"  - {hotspot['file']} (complexity: {hotspot['complexity']})")
        
        # Architecture suggestions
        purposes = [p["purpose"] for p in insights["main_purposes"]]
        if "testing" not in purposes:
            suggestions.append("**Add Testing:** No test files detected. Consider adding unit tests.")
        
        if "documentation" not in purposes:
            suggestions.append("**Add Documentation:** Consider adding more documentation files.")
        
        # File organization suggestions
        file_count = sum(p["count"] for p in insights["main_purposes"])
        if file_count > 20:
            suggestions.append("**File Organization:** Consider organizing files into subdirectories by purpose.")
        
        # Performance suggestions
        if any("engine" in p["purpose"] for p in insights["main_purposes"]):
            suggestions.append("**Performance:** Consider adding caching or optimization to engine components.")
        
        for suggestion in suggestions:
            response += f"{suggestion}\n"
        
        if not suggestions:
            response += "Your codebase looks well-structured! No major improvements needed right now."
        
        return response
    
    def respond_about_explanation(self, user_input):
        """Explain what the codebase does"""
        insights = self.generate_codebase_insights()
        
        response = f"🧠 **WHAT YOUR CODEBASE DOES:**\n\n"
        
        # Main purpose analysis
        main_purposes = insights["main_purposes"][:5]
        
        if any("web_server" in p["purpose"] for p in main_purposes):
            response += "This is a **web application** that:\n"
        elif any("engine" in p["purpose"] for p in main_purposes):
            response += "This is a **processing engine** that:\n"
        else:
            response += "This is a **software system** that:\n"
        
        for purpose_info in main_purposes:
            purpose = purpose_info["purpose"].replace("_", " ").title()
            count = purpose_info["count"]
            response += f"- Handles {purpose} ({count} files)\n"
        
        # Architecture explanation
        if insights["architecture_patterns"]:
            response += f"\n**Architecture Style:**\n"
            for pattern in insights["architecture_patterns"]:
                if pattern == "web_application":
                    response += "- Web-based application with HTTP endpoints\n"
                elif pattern == "data_persistence":
                    response += "- Uses database for data storage\n"
                elif pattern == "api_architecture":
                    response += "- Provides API interfaces for external access\n"
                elif pattern == "engine_pattern":
                    response += "- Contains core processing engines\n"
        
        # Key components
        response += f"\n**Key Components:**\n"
        
        # Find the most important files
        important_files = self.conn.execute('''
            SELECT file_path, purpose, lines_of_code 
            FROM codebase_files 
            WHERE purpose IN ('web_server', 'core_logic', 'engine', 'framework_definition')
            ORDER BY lines_of_code DESC 
            LIMIT 5
        ''').fetchall()
        
        for file_path, purpose, lines in important_files:
            response += f"- **{os.path.basename(file_path)}** - {purpose.replace('_', ' ').title()} ({lines} lines)\n"
        
        return response
    
    def respond_general_codebase(self, user_input):
        """General response about the codebase"""
        total_files = self.conn.execute('SELECT COUNT(*) FROM codebase_files').fetchone()[0]
        
        if total_files == 0:
            return "I haven't analyzed your codebase yet. Let me scan it first to give you intelligent responses!"
        
        response = f"🎯 **YOUR CODEBASE OVERVIEW:**\n\n"
        response += f"I've analyzed {total_files} files in your codebase.\n\n"
        
        # Quick stats
        stats = self.conn.execute('''
            SELECT 
                COUNT(*) as total_files,
                SUM(lines_of_code) as total_lines,
                COUNT(DISTINCT file_type) as file_types
            FROM codebase_files
        ''').fetchone()
        
        response += f"**Quick Stats:**\n"
        response += f"- {stats[0]} files analyzed\n"
        response += f"- {stats[1]:,} total lines of code\n"
        response += f"- {stats[2]} different file types\n\n"
        
        response += f"Ask me about:\n"
        response += f"- `functions` - What functions you have\n"
        response += f"- `classes` - Your class structure\n"
        response += f"- `files` - File organization\n"
        response += f"- `architecture` - System design\n"
        response += f"- `improvements` - How to make it better\n"
        response += f"- `what does this do` - Explain your code\n"
        
        return response

class SmartAnalyzerHandler(BaseHTTPRequestHandler):
    """HTTP handler for smart codebase analysis"""
    
    def __init__(self, analyzer, *args, **kwargs):
        self.analyzer = analyzer
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        path = urlparse(self.path).path
        
        if path == '/':
            self.serve_main_interface()
        elif path == '/analyze':
            self.run_analysis()
        elif path == '/api/status':
            self.serve_status()
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            path = urlparse(self.path).path
            
            if path == '/api/ask':
                user_input = data.get('question', '')
                response = self.analyzer.get_smart_response(user_input)
                
                # Store interaction
                self.analyzer.conn.execute('''
                    INSERT INTO user_interactions (user_input, smart_response)
                    VALUES (?, ?)
                ''', (user_input, response))
                self.analyzer.conn.commit()
                
                self.send_json_response({
                    'response': response,
                    'timestamp': datetime.now().isoformat()
                })
            
            else:
                self.send_error(404)
                
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def serve_main_interface(self):
        """Serve the smart analyzer interface"""
        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧠 Smart Codebase Analyzer</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Monaco', 'Menlo', monospace; 
            background: #1a1a1a;
            color: #00ff00;
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        
        .header {{
            text-align: center;
            margin-bottom: 30px;
            border: 2px solid #00ff00;
            padding: 20px;
            background: rgba(0, 255, 0, 0.1);
        }}
        
        .title {{
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 0 0 10px #00ff00;
        }}
        
        .subtitle {{
            font-size: 1.2em;
            opacity: 0.8;
        }}
        
        .main-content {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }}
        
        .chat-area {{
            border: 2px solid #00ff00;
            padding: 20px;
            background: rgba(0, 255, 0, 0.05);
        }}
        
        .chat-messages {{
            height: 400px;
            overflow-y: auto;
            border: 1px solid #004400;
            padding: 15px;
            margin-bottom: 15px;
            background: #0a0a0a;
        }}
        
        .message {{
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
        }}
        
        .user-message {{
            background: rgba(0, 100, 255, 0.2);
            border-left: 3px solid #0066ff;
        }}
        
        .ai-message {{
            background: rgba(0, 255, 0, 0.2);
            border-left: 3px solid #00ff00;
        }}
        
        .input-area {{
            display: flex;
            gap: 10px;
        }}
        
        .chat-input {{
            flex: 1;
            background: #0a0a0a;
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 12px;
            font-family: inherit;
            font-size: 14px;
        }}
        
        .send-btn {{
            background: #00ff00;
            color: #000;
            border: none;
            padding: 12px 20px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }}
        
        .send-btn:hover {{
            background: #00cc00;
            box-shadow: 0 0 10px #00ff00;
        }}
        
        .analysis-panel {{
            border: 2px solid #00ff00;
            padding: 20px;
            background: rgba(0, 255, 0, 0.05);
        }}
        
        .analyze-btn {{
            background: #ff6600;
            color: #fff;
            border: none;
            padding: 15px 25px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 20px;
            transition: all 0.3s;
        }}
        
        .analyze-btn:hover {{
            background: #ff4400;
            box-shadow: 0 0 15px #ff6600;
        }}
        
        .status-display {{
            border: 1px solid #444;
            padding: 15px;
            background: #0a0a0a;
            min-height: 300px;
            overflow-y: auto;
        }}
        
        .quick-questions {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 20px;
        }}
        
        .quick-btn {{
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 10px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 12px;
        }}
        
        .quick-btn:hover {{
            background: rgba(0, 255, 0, 0.2);
            box-shadow: 0 0 5px #00ff00;
        }}
        
        .typing {{
            opacity: 0.6;
            font-style: italic;
        }}
        
        @media (max-width: 768px) {{
            .main-content {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🧠 SMART CODEBASE ANALYZER</h1>
            <p class="subtitle">Actually understands YOUR code and gives intelligent responses</p>
        </div>
        
        <div class="main-content">
            <div class="chat-area">
                <h3>💬 Ask About Your Codebase</h3>
                <div class="chat-messages" id="chatMessages">
                    <div class="message ai-message">
                        <strong>🤖 AI:</strong> Hi! I'm ready to analyze your codebase and answer intelligent questions about YOUR specific code. Start by clicking "Analyze Codebase" or ask me anything!
                    </div>
                </div>
                <div class="input-area">
                    <input type="text" class="chat-input" id="chatInput" 
                           placeholder="Ask about functions, classes, architecture, improvements..."
                           onkeypress="if(event.key === 'Enter') sendMessage()">
                    <button class="send-btn" onclick="sendMessage()">SEND</button>
                </div>
                
                <div class="quick-questions">
                    <button class="quick-btn" onclick="askQuestion('what does this codebase do?')">What does this do?</button>
                    <button class="quick-btn" onclick="askQuestion('show me the functions')">Show functions</button>
                    <button class="quick-btn" onclick="askQuestion('what is the architecture?')">Architecture</button>
                    <button class="quick-btn" onclick="askQuestion('how can I improve this?')">Improvements</button>
                    <button class="quick-btn" onclick="askQuestion('show me the files')">File structure</button>
                    <button class="quick-btn" onclick="askQuestion('what are the classes?')">Classes</button>
                </div>
            </div>
            
            <div class="analysis-panel">
                <h3>🔍 Codebase Analysis</h3>
                <button class="analyze-btn" onclick="analyzeCodebase()">🚀 ANALYZE CODEBASE</button>
                <div class="status-display" id="statusDisplay">
                    <div style="color: #888;">Click "Analyze Codebase" to scan your files and enable intelligent responses...</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function sendMessage() {{
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) return;
            
            addMessage('user', message);
            input.value = '';
            
            // Show typing indicator
            addMessage('ai', 'Analyzing your question...', true);
            
            fetch('/api/ask', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{'question': message}})
            }})
            .then(response => response.json())
            .then(data => {{
                removeTypingIndicator();
                addMessage('ai', data.response || data.error);
            }})
            .catch(error => {{
                removeTypingIndicator();
                addMessage('ai', 'Error: ' + error.message);
            }});
        }}
        
        function askQuestion(question) {{
            document.getElementById('chatInput').value = question;
            sendMessage();
        }}
        
        function addMessage(sender, message, typing = false) {{
            const messages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${{sender}}-message ${{typing ? 'typing' : ''}}`;
            
            const icon = sender === 'user' ? '👤' : '🤖';
            const label = sender === 'user' ? 'You' : 'AI';
            
            messageDiv.innerHTML = `<strong>${{icon}} ${{label}}:</strong> ${{message.replace(/\\n/g, '<br>')}}`;
            
            if (typing) {{
                messageDiv.id = 'typing-indicator';
            }}
            
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }}
        
        function removeTypingIndicator() {{
            const indicator = document.getElementById('typing-indicator');
            if (indicator) {{
                indicator.remove();
            }}
        }}
        
        function analyzeCodebase() {{
            const status = document.getElementById('statusDisplay');
            status.innerHTML = '<div style="color: #ff6600;">🔍 Analyzing codebase...</div>';
            
            fetch('/analyze')
            .then(response => response.text())
            .then(data => {{
                status.innerHTML = data.replace(/\\n/g, '<br>');
                addMessage('ai', 'Codebase analysis complete! Now I can answer intelligent questions about your specific code.');
            }})
            .catch(error => {{
                status.innerHTML = '<div style="color: #ff0000;">Error: ' + error.message + '</div>';
            }});
        }}
        
        // Auto-focus on input
        document.getElementById('chatInput').focus();
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def run_analysis(self):
        """Run codebase analysis and return results"""
        try:
            results = self.analyzer.analyze_entire_codebase()
            
            output = f"""<div style="color: #00ff00;">
✅ CODEBASE ANALYSIS COMPLETE!

📊 RESULTS:
• {results['total_files']} files analyzed
• {results['python_files']} Python files  
• {results['javascript_files']} JS/TS files

🎯 MAIN PURPOSES:
"""
            
            for purpose in results['main_purposes'][:5]:
                output += f"• {purpose['purpose'].replace('_', ' ').title()}: {purpose['count']} files<br>"
            
            if results['architecture_patterns']:
                output += f"<br>🏛️ ARCHITECTURE PATTERNS:<br>"
                for pattern in results['architecture_patterns']:
                    output += f"• {pattern.replace('_', ' ').title()}<br>"
            
            if results['complexity_hotspots']:
                output += f"<br>🔥 COMPLEXITY HOTSPOTS:<br>"
                for hotspot in results['complexity_hotspots'][:3]:
                    output += f"• {hotspot['file']} (complexity: {hotspot['complexity']})<br>"
            
            output += f"""<br>🧠 INTELLIGENCE ENABLED:
Now I can answer smart questions about YOUR specific codebase!

Ask me about:
• Functions and what they do
• Class structure and relationships  
• File organization and purposes
• Architecture patterns
• Improvement suggestions
• Code explanations
</div>"""
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(output.encode('utf-8'))
            
        except Exception as e:
            error_output = f'<div style="color: #ff0000;">Analysis failed: {str(e)}</div>'
            self.send_response(500)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(error_output.encode('utf-8'))
    
    def serve_status(self):
        """Serve analysis status"""
        total_files = self.analyzer.conn.execute('SELECT COUNT(*) FROM codebase_files').fetchone()[0]
        
        status = {
            'analyzed': total_files > 0,
            'total_files': total_files,
            'ready_for_questions': total_files > 0
        }
        
        self.send_json_response(status)
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override to reduce log spam"""
        pass

def run_smart_analyzer():
    """Run the smart codebase analyzer"""
    analyzer = SmartCodebaseAnalyzer()
    
    def handler(*args, **kwargs):
        return SmartAnalyzerHandler(analyzer, *args, **kwargs)
    
    server = HTTPServer(('localhost', analyzer.port), handler)
    
    print(f"""
🧠🧠🧠 SMART CODEBASE ANALYZER LAUNCHED! 🧠🧠🧠

🌐 Interface: http://localhost:{analyzer.port}

🎯 FEATURES:
✅ Analyzes YOUR specific codebase intelligently  
✅ Understands functions, classes, and architecture
✅ Gives smart answers about YOUR code
✅ Suggests real improvements
✅ Explains what your code actually does
✅ No more generic bullshit responses!

Ready to actually understand your codebase! 🚀
""")
    
    server.serve_forever()

if __name__ == '__main__':
    run_smart_analyzer()