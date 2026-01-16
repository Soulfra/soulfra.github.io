from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
CHAT LOG PROCESSOR - Turn your chat logs into working documentation and code
- Drop chat logs in, get full documentation out
- Send to AI agents for implementation
- Keep iterating until everything works in one ecosystem
"""

import os
import json
import time
import re
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

class ChatLogProcessor:
    """Process chat logs into actionable documentation and tasks"""
    
    def __init__(self):
        self.port = 4040  # Different port to avoid conflicts
        self.chat_logs_dir = "chat_logs"
        self.documentation_dir = "generated_docs" 
        self.tasks_dir = "ai_tasks"
        self.ensure_directories()
        
    def ensure_directories(self):
        """Create necessary directories"""
        for dir_name in [self.chat_logs_dir, self.documentation_dir, self.tasks_dir]:
            if not os.path.exists(dir_name):
                os.makedirs(dir_name)
                print(f"[DIR] Created directory: {dir_name}")
    
    def process_chat_log(self, chat_content, filename):
        """Process a chat log into structured documentation"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Extract key information
        analysis = self.analyze_chat_content(chat_content)
        
        # Generate documentation
        documentation = self.generate_documentation(analysis, filename)
        
        # Create AI tasks
        ai_tasks = self.generate_ai_tasks(analysis, filename)
        
        # Save everything
        doc_file = f"{self.documentation_dir}/{filename}_{timestamp}_docs.md"
        task_file = f"{self.tasks_dir}/{filename}_{timestamp}_tasks.json"
        
        with open(doc_file, 'w') as f:
            f.write(documentation)
        
        with open(task_file, 'w') as f:
            json.dump(ai_tasks, f, indent=2)
        
        return {
            'documentation_file': doc_file,
            'tasks_file': task_file,
            'analysis': analysis,
            'next_steps': self.get_next_steps(analysis)
        }
    
    def analyze_chat_content(self, content):
        """Analyze chat content to extract key information"""
        analysis = {
            'conversation_type': self.detect_conversation_type(content),
            'technical_concepts': self.extract_technical_concepts(content),
            'code_blocks': self.extract_code_blocks(content),
            'file_mentions': self.extract_file_mentions(content),
            'user_requests': self.extract_user_requests(content),
            'ai_responses': self.extract_ai_responses(content),
            'errors_mentioned': self.extract_errors(content),
            'solutions_proposed': self.extract_solutions(content),
            'tools_mentioned': self.extract_tools(content),
            'workflow_steps': self.extract_workflow_steps(content)
        }
        return analysis
    
    def detect_conversation_type(self, content):
        """Detect what type of conversation this is"""
        content_lower = content.lower()
        
        if any(word in content_lower for word in ['debug', 'error', 'fix', 'broken']):
            return 'debugging'
        elif any(word in content_lower for word in ['create', 'build', 'implement', 'new']):
            return 'development'
        elif any(word in content_lower for word in ['explain', 'understand', 'how does', 'what is']):
            return 'learning'
        elif any(word in content_lower for word in ['integrate', 'connect', 'combine', 'ecosystem']):
            return 'integration'
        else:
            return 'general'
    
    def extract_technical_concepts(self, content):
        """Extract technical concepts mentioned"""
        concepts = []
        
        # Programming languages
        languages = re.findall(r'\b(python|javascript|typescript|java|rust|go|cpp?)\b', content, re.IGNORECASE)
        concepts.extend([f"Language: {lang}" for lang in set(languages)])
        
        # Technologies
        tech_patterns = [
            r'\b(api|rest|graphql|websocket|http|https)\b',
            r'\b(docker|kubernetes|aws|gcp|azure)\b',
            r'\b(react|vue|angular|express|flask|django)\b',
            r'\b(mongodb|postgresql|mysql|redis|sqlite)\b',
            r'\b(claude|openai|gpt|codex|anthropic)\b'
        ]
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            concepts.extend([f"Technology: {match}" for match in set(matches)])
        
        return list(set(concepts))
    
    def extract_code_blocks(self, content):
        """Extract code blocks from the conversation"""
        # Match code blocks in markdown format
        code_blocks = re.findall(r'```(\w+)?\n(.*?)\n```', content, re.DOTALL)
        
        extracted = []
        for i, (language, code) in enumerate(code_blocks):
            extracted.append({
                'index': i + 1,
                'language': language or 'unknown',
                'code': code.strip(),
                'lines': len(code.strip().split('\n'))
            })
        
        return extracted
    
    def extract_file_mentions(self, content):
        """Extract file names mentioned"""
        # Match file patterns
        file_patterns = [
            r'\b\w+\.py\b',
            r'\b\w+\.js\b',
            r'\b\w+\.ts\b',
            r'\b\w+\.json\b',
            r'\b\w+\.md\b',
            r'\b\w+\.txt\b'
        ]
        
        files = []
        for pattern in file_patterns:
            matches = re.findall(pattern, content)
            files.extend(matches)
        
        return list(set(files))
    
    def extract_user_requests(self, content):
        """Extract user requests and goals"""
        # Look for common request patterns
        request_patterns = [
            r'(?:can you|could you|please|i want|i need|how do i|help me)\s+([^.!?]+)',
            r'(?:create|build|make|implement|add)\s+([^.!?]+)',
            r'(?:fix|debug|solve|resolve)\s+([^.!?]+)'
        ]
        
        requests = []
        for pattern in request_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            requests.extend([match.strip() for match in matches])
        
        return requests[:10]  # Limit to top 10
    
    def extract_ai_responses(self, content):
        """Extract key AI responses and solutions"""
        # Look for solution patterns
        solution_patterns = [
            r'(?:here\'s|this is|try this|solution|approach):\s*([^.!?]+)',
            r'(?:i\'ll|let me|i can)\s+([^.!?]+)',
            r'(?:the fix is|to solve this|the solution)\s+([^.!?]+)'
        ]
        
        responses = []
        for pattern in solution_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            responses.extend([match.strip() for match in matches])
        
        return responses[:10]  # Limit to top 10
    
    def extract_errors(self, content):
        """Extract error messages and issues"""
        error_patterns = [
            r'error[:\s]+([^.!?\n]+)',
            r'failed[:\s]+([^.!?\n]+)',
            r'exception[:\s]+([^.!?\n]+)',
            r'timeout[:\s]+([^.!?\n]+)'
        ]
        
        errors = []
        for pattern in error_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            errors.extend([match.strip() for match in matches])
        
        return errors[:5]  # Limit to top 5
    
    def extract_solutions(self, content):
        """Extract proposed solutions"""
        solution_patterns = [
            r'(?:fix|solution|resolve)[:\s]+([^.!?\n]+)',
            r'(?:try|use|install|run)[:\s]+([^.!?\n]+)',
            r'(?:instead|alternative|better)[:\s]+([^.!?\n]+)'
        ]
        
        solutions = []
        for pattern in solution_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            solutions.extend([match.strip() for match in matches])
        
        return solutions[:10]  # Limit to top 10
    
    def extract_tools(self, content):
        """Extract tools and technologies mentioned"""
        tools = []
        
        # Common development tools
        tool_patterns = [
            r'\b(git|npm|pip|docker|kubernetes|webpack|babel)\b',
            r'\b(vscode|sublime|atom|vim|emacs)\b',
            r'\b(claude-code|codex|github|gitlab|bitbucket)\b'
        ]
        
        for pattern in tool_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            tools.extend(matches)
        
        return list(set(tools))
    
    def extract_workflow_steps(self, content):
        """Extract workflow steps from the conversation"""
        # Look for numbered lists or step patterns
        step_patterns = [
            r'(?:step|stage|phase)\s*(\d+)[:\s]+([^.!?\n]+)',
            r'(\d+)\.\s+([^.!?\n]+)',
            r'(?:first|then|next|finally)[:\s]+([^.!?\n]+)'
        ]
        
        steps = []
        for pattern in step_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple) and len(match) == 2:
                    steps.append(f"{match[0]}: {match[1].strip()}")
                else:
                    steps.append(match.strip())
        
        return steps[:15]  # Limit to top 15
    
    def generate_documentation(self, analysis, filename):
        """Generate comprehensive documentation from analysis"""
        doc = f"""# Documentation Generated from {filename}

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Conversation Type:** {analysis['conversation_type'].title()}

## Overview

This document was automatically generated from a chat log conversation focused on {analysis['conversation_type']} tasks.

## Technical Concepts Identified

"""
        
        if analysis['technical_concepts']:
            for concept in analysis['technical_concepts']:
                doc += f"- {concept}\n"
        else:
            doc += "- No specific technical concepts identified\n"
        
        doc += f"""
## Files Mentioned

"""
        if analysis['file_mentions']:
            for file in analysis['file_mentions']:
                doc += f"- `{file}`\n"
        else:
            doc += "- No specific files mentioned\n"
        
        doc += f"""
## Tools & Technologies

"""
        if analysis['tools_mentioned']:
            for tool in analysis['tools_mentioned']:
                doc += f"- {tool}\n"
        else:
            doc += "- No specific tools mentioned\n"
        
        doc += f"""
## User Requests & Goals

"""
        if analysis['user_requests']:
            for i, request in enumerate(analysis['user_requests'], 1):
                doc += f"{i}. {request}\n"
        else:
            doc += "- No specific requests identified\n"
        
        doc += f"""
## AI Solutions Proposed

"""
        if analysis['ai_responses']:
            for i, response in enumerate(analysis['ai_responses'], 1):
                doc += f"{i}. {response}\n"
        else:
            doc += "- No specific solutions identified\n"
        
        doc += f"""
## Code Blocks Found

"""
        if analysis['code_blocks']:
            for block in analysis['code_blocks']:
                doc += f"### Code Block {block['index']} ({block['language']})\n"
                doc += f"```{block['language']}\n{block['code']}\n```\n\n"
        else:
            doc += "- No code blocks found\n"
        
        doc += f"""
## Errors & Issues

"""
        if analysis['errors_mentioned']:
            for error in analysis['errors_mentioned']:
                doc += f"- {error}\n"
        else:
            doc += "- No errors identified\n"
        
        doc += f"""
## Proposed Solutions

"""
        if analysis['solutions_proposed']:
            for solution in analysis['solutions_proposed']:
                doc += f"- {solution}\n"
        else:
            doc += "- No solutions identified\n"
        
        doc += f"""
## Workflow Steps

"""
        if analysis['workflow_steps']:
            for step in analysis['workflow_steps']:
                doc += f"- {step}\n"
        else:
            doc += "- No workflow steps identified\n"
        
        doc += f"""
## Next Steps

1. Review the extracted information above
2. Use the generated AI tasks to implement solutions
3. Send tasks to Claude, Cal, Codex for implementation
4. Iterate until everything works in the ecosystem

---

*This documentation was automatically generated by Chat Log Processor*
"""
        
        return doc
    
    def generate_ai_tasks(self, analysis, filename):
        """Generate specific tasks for AI agents"""
        tasks = {
            'metadata': {
                'source_file': filename,
                'generated_at': datetime.now().isoformat(),
                'conversation_type': analysis['conversation_type']
            },
            'tasks_for_claude': [],
            'tasks_for_cal': [],
            'tasks_for_codex': [],
            'general_tasks': []
        }
        
        # Generate Claude tasks (code generation/documentation)
        if analysis['code_blocks']:
            tasks['tasks_for_claude'].append({
                'type': 'code_review',
                'description': f"Review and improve {len(analysis['code_blocks'])} code blocks",
                'priority': 'high',
                'files': analysis['file_mentions']
            })
        
        if analysis['user_requests']:
            for request in analysis['user_requests'][:3]:
                tasks['tasks_for_claude'].append({
                    'type': 'implementation',
                    'description': f"Implement: {request}",
                    'priority': 'medium'
                })
        
        # Generate Cal tasks (architecture/integration)
        if analysis['conversation_type'] == 'integration':
            tasks['tasks_for_cal'].append({
                'type': 'architecture_design',
                'description': 'Design integration architecture for the ecosystem',
                'priority': 'high',
                'technologies': analysis['technical_concepts']
            })
        
        if analysis['tools_mentioned']:
            tasks['tasks_for_cal'].append({
                'type': 'tool_integration',
                'description': f"Integrate tools: {', '.join(analysis['tools_mentioned'])}",
                'priority': 'medium'
            })
        
        # Generate Codex tasks (optimization/refactoring)
        if analysis['errors_mentioned']:
            tasks['tasks_for_codex'].append({
                'type': 'error_fixing',
                'description': 'Fix identified errors and improve error handling',
                'priority': 'high',
                'errors': analysis['errors_mentioned']
            })
        
        if analysis['solutions_proposed']:
            tasks['tasks_for_codex'].append({
                'type': 'optimization',
                'description': 'Optimize proposed solutions for better performance',
                'priority': 'medium',
                'solutions': analysis['solutions_proposed']
            })
        
        # Generate general tasks
        tasks['general_tasks'].append({
            'type': 'documentation_update',
            'description': 'Update project documentation with new insights',
            'priority': 'low'
        })
        
        if analysis['workflow_steps']:
            tasks['general_tasks'].append({
                'type': 'workflow_automation',
                'description': 'Automate identified workflow steps',
                'priority': 'medium',
                'steps': analysis['workflow_steps']
            })
        
        return tasks
    
    def get_next_steps(self, analysis):
        """Get recommended next steps"""
        steps = []
        
        if analysis['conversation_type'] == 'debugging':
            steps.extend([
                "Send error fixing tasks to Codex",
                "Have Claude review and improve error handling",
                "Test solutions in the ecosystem"
            ])
        elif analysis['conversation_type'] == 'development':
            steps.extend([
                "Send implementation tasks to Claude",
                "Have Cal design the architecture",
                "Use Codex for optimization"
            ])
        elif analysis['conversation_type'] == 'integration':
            steps.extend([
                "Send integration tasks to Cal",
                "Have Claude implement the connections",
                "Use Codex to optimize performance"
            ])
        
        steps.extend([
            "Review generated documentation",
            "Execute AI tasks in priority order",
            "Iterate until ecosystem is complete"
        ])
        
        return steps

class ChatLogHandler(BaseHTTPRequestHandler):
    """HTTP handler for chat log processing"""
    
    def log_message(self, format, *args):
        """Suppress HTTP logs"""
        return
    
    def do_GET(self):
        if self.path == '/':
            self.serve_interface()
        elif self.path == '/status':
            self.serve_status()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/process':
            self.handle_process()
        else:
            self.send_response(404)
            self.end_headers()
    
    def serve_interface(self):
        """Serve the chat log processing interface"""
        html = '''<!DOCTYPE html>
<html>
<head>
    <title>Chat Log Processor</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #000; color: #0f0; margin: 0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .section { background: #111; border: 1px solid #333; margin: 15px 0; padding: 20px; border-radius: 5px; }
        .upload-area { border: 2px dashed #333; padding: 40px; text-align: center; margin: 20px 0; }
        .upload-area:hover { border-color: #0f0; background: #111; }
        textarea { width: 100%; height: 200px; background: #000; color: #0f0; border: 1px solid #333; padding: 10px; font-family: monospace; }
        input[type="text"] { width: 100%; background: #000; color: #0f0; border: 1px solid #333; padding: 8px; }
        button { background: #111; color: #0f0; border: 1px solid #333; padding: 10px 20px; cursor: pointer; margin: 5px; }
        button:hover { background: #222; }
        .output { background: #000; border: 1px solid #333; padding: 15px; min-height: 100px; white-space: pre-wrap; font-size: 12px; }
        .success { color: #0f0; }
        .error { color: #f44; }
        .task-list { columns: 2; column-gap: 20px; }
        .task-item { break-inside: avoid; margin-bottom: 10px; padding: 10px; background: #222; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>CHAT LOG PROCESSOR</h1>
        <p>Drop your chat logs → Get full documentation → Send to AI agents → Build your ecosystem</p>
        
        <div class="section">
            <h3>Input Your Chat Log</h3>
            <input type="text" id="filename" placeholder="Enter filename (e.g., 'cli_integration_chat')" value="chat_log_" />
            
            <div class="upload-area" onclick="document.getElementById('chat-input').focus()">
                <p>Click here and paste your chat log content</p>
                <p>(Copy and paste your entire conversation)</p>
            </div>
            
            <textarea id="chat-input" placeholder="Paste your chat log content here...

Example:
User: I want to create a CLI integration system
Assistant: I'll help you create a unified CLI integration...
User: Can you also add GitHub automation?
Assistant: Sure, I'll add that functionality...
"></textarea>
            
            <button onclick="processLog()">Process Chat Log</button>
            <button onclick="clearInput()">Clear</button>
        </div>
        
        <div class="section">
            <h3>Processing Results</h3>
            <div id="results" class="output">Ready to process chat logs...

Your workflow:
1. Paste chat log above
2. Click "Process Chat Log"  
3. Get structured documentation
4. Get AI tasks for Claude, Cal, Codex
5. Send tasks to AI agents
6. Iterate until ecosystem is complete</div>
        </div>
        
        <div class="section">
            <h3>Generated AI Tasks</h3>
            <div id="tasks" class="task-list">No tasks generated yet...</div>
        </div>
        
        <div class="section">
            <h3>Next Steps</h3>
            <div id="next-steps">
                <p><strong>After processing your chat log:</strong></p>
                <ol>
                    <li>Review generated documentation</li>
                    <li>Send Claude tasks to Claude Code CLI</li>
                    <li>Send Cal tasks to Cal Riven</li>
                    <li>Send Codex tasks to Codex CLI</li>
                    <li>Iterate until everything works</li>
                    <li>Deploy to unified ecosystem</li>
                </ol>
            </div>
        </div>
    </div>
    
    <script>
        function processLog() {
            const filename = document.getElementById('filename').value.trim();
            const content = document.getElementById('chat-input').value.trim();
            const results = document.getElementById('results');
            const tasks = document.getElementById('tasks');
            
            if (!content) {
                results.className = 'output error';
                results.textContent = '[ERROR] Please paste your chat log content first';
                return;
            }
            
            if (!filename) {
                results.className = 'output error';
                results.textContent = '[ERROR] Please enter a filename';
                return;
            }
            
            results.className = 'output';
            results.textContent = '[PROCESSING] Processing chat log...\\n\\nAnalyzing content...\\nExtracting technical concepts...\\nGenerating documentation...\\nCreating AI tasks...';
            
            const formData = new FormData();
            formData.append('filename', filename);
            formData.append('content', content);
            
            fetch('/process', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    results.className = 'output success';
                    results.textContent = `[SUCCESS] CHAT LOG PROCESSED SUCCESSFULLY!
                    
Documentation: ${data.documentation_file}
AI Tasks: ${data.tasks_file}

ANALYSIS RESULTS:
- Conversation Type: ${data.analysis.conversation_type}
- Technical Concepts: ${data.analysis.technical_concepts.length}
- Code Blocks: ${data.analysis.code_blocks.length}  
- Files Mentioned: ${data.analysis.file_mentions.length}
- User Requests: ${data.analysis.user_requests.length}
- AI Responses: ${data.analysis.ai_responses.length}
- Errors Found: ${data.analysis.errors_mentioned.length}
- Solutions Proposed: ${data.analysis.solutions_proposed.length}
- Tools Mentioned: ${data.analysis.tools_mentioned.length}
- Workflow Steps: ${data.analysis.workflow_steps.length}

NEXT STEPS:
${data.next_steps.map(step => '- ' + step).join('\\n')}`;
                    
                    // Display tasks
                    displayTasks(data.tasks);
                } else {
                    results.className = 'output error';
                    results.textContent = `[ERROR] Error: ${data.error}`;
                }
            })
            .catch(error => {
                results.className = 'output error';
                results.textContent = `[ERROR] Network error: ${error}`;
            });
        }
        
        function displayTasks(taskData) {
            const tasksDiv = document.getElementById('tasks');
            let html = '';
            
            Object.entries(taskData).forEach(([agent, tasks]) => {
                if (agent !== 'metadata' && tasks.length > 0) {
                    html += `<div class="task-item">
                        <h4>${agent.replace('tasks_for_', '').toUpperCase()}</h4>
                        ${tasks.map(task => `<p>- ${task.description} (${task.priority})</p>`).join('')}
                    </div>`;
                }
            });
            
            if (html) {
                tasksDiv.innerHTML = html;
            } else {
                tasksDiv.innerHTML = '<p>No specific tasks generated</p>';
            }
        }
        
        function clearInput() {
            document.getElementById('chat-input').value = '';
            document.getElementById('filename').value = 'chat_log_';
            document.getElementById('results').textContent = 'Ready to process chat logs...';
            document.getElementById('tasks').innerHTML = 'No tasks generated yet...';
        }
        
        // Auto-focus on chat input
        document.getElementById('chat-input').focus();
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_status(self):
        """Serve status"""
        status = {
            'status': 'running',
            'directories_ready': True,
            'processor_version': '1.0'
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())
    
    def handle_process(self):
        """Handle chat log processing"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse multipart form data manually (simple version)
            boundary = self.headers['Content-Type'].split('boundary=')[1]
            parts = post_data.split(f'--{boundary}'.encode())
            
            filename = None
            content = None
            
            for part in parts:
                if b'name="filename"' in part:
                    filename = part.split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8')
                elif b'name="content"' in part:
                    content = part.split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8')
            
            if not filename or not content:
                result = {'success': False, 'error': 'Missing filename or content'}
            else:
                # Process the chat log
                result = self.server.processor.process_chat_log(content, filename)
                result['success'] = True
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            result = {'success': False, 'error': str(e)}
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

def main():
    """Main function"""
    processor = ChatLogProcessor()
    
    print(f"""
=== CHAT LOG PROCESSOR READY! ===

[WORKFLOW]
   1. Dump chat logs into the interface
   2. Get full structured documentation
   3. Get specific tasks for Claude, Cal, Codex
   4. Send tasks to AI agents
   5. Iterate until everything works in one ecosystem

[INTERFACE] http://localhost:{processor.port}

[DIRECTORIES CREATED]
   - {processor.chat_logs_dir}/ (for your chat logs)
   - {processor.documentation_dir}/ (generated docs)
   - {processor.tasks_dir}/ (AI agent tasks)

[PROCESS]
   Chat Logs -> Documentation -> AI Tasks -> Working Ecosystem
""")
    
    try:
        server = HTTPServer(('localhost', processor.port), ChatLogHandler)
        server.processor = processor
        
        print(f"[READY] Chat Log Processor ready at http://localhost:{processor.port}")
        print("[INFO] Just paste your chat logs and get everything organized for your AI agents!")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n[STOPPED] Chat Log Processor stopped")
    except Exception as e:
        print(f"[ERROR] Error: {e}")

if __name__ == '__main__':
    main()