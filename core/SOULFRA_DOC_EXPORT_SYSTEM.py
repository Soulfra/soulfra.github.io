#!/usr/bin/env python3
"""
SOULFRA DOCUMENTATION EXPORT SYSTEM
- Auto-generates structured docs like TIMEOUT_SOLUTION_SUMMARY.md
- Exports to LLMs with proper context
- Manages private GitHub repos
- Tracks changes and improvements
"""

import os
import json
import hashlib
import subprocess
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import sqlite3
from pathlib import Path
import base64
import tempfile

class DocumentGenerator:
    """Generates structured documentation from system state"""
    
    def __init__(self):
        self.templates = {
            "problem_solution": self._problem_solution_template,
            "architecture": self._architecture_template,
            "integration": self._integration_template,
            "troubleshooting": self._troubleshooting_template,
            "changelog": self._changelog_template
        }
        
    def generate_problem_solution_doc(self, problem: Dict) -> str:
        """Generate a problem/solution document like TIMEOUT_SOLUTION_SUMMARY"""
        return f"""# {problem['title']}

## The Problem
{self._format_list(problem['issues'])}

## Root Cause Analysis
{problem.get('root_cause', 'Analysis pending...')}

## Solution Options

{self._format_solutions(problem['solutions'])}

## Recommendation: {problem['recommended_solution']['name']}

{problem['recommended_solution']['rationale']}

### Implementation Steps
{self._format_steps(problem['recommended_solution']['steps'])}

### Expected Results
{self._format_list(problem['recommended_solution']['results'])}

## Current Status
{self._format_status(problem['status'])}

## Verification
```bash
{problem['verification_commands']}
```

---
*Generated: {datetime.now().isoformat()}*
*System: Soulfra Documentation Engine*
"""

    def _format_list(self, items: List[str]) -> str:
        return '\n'.join(f"- {item}" for item in items)
        
    def _format_solutions(self, solutions: List[Dict]) -> str:
        output = []
        for i, solution in enumerate(solutions, 1):
            output.append(f"### {i}. {solution['name']}")
            if solution.get('description'):
                output.append(solution['description'])
            output.append("\n**Benefits:**")
            output.append(self._format_list(solution.get('benefits', [])))
            output.append("\n**Requirements:**")
            output.append(self._format_list(solution.get('requirements', [])))
            output.append("")
        return '\n'.join(output)
        
    def _format_steps(self, steps: List[Dict]) -> str:
        output = []
        for i, step in enumerate(steps, 1):
            output.append(f"{i}. **{step['action']}**")
            if step.get('command'):
                output.append(f"   ```bash\n   {step['command']}\n   ```")
            if step.get('note'):
                output.append(f"   > {step['note']}")
        return '\n'.join(output)
        
    def _format_status(self, status: Dict) -> str:
        output = []
        for key, value in status.items():
            if isinstance(value, bool):
                emoji = "✅" if value else "❌"
                output.append(f"{emoji} {key}")
            elif isinstance(value, list):
                output.append(f"\n**{key}:**")
                output.append(self._format_list(value))
            else:
                output.append(f"**{key}**: {value}")
        return '\n'.join(output)

    def _problem_solution_template(self, data: Dict) -> str:
        return self.generate_problem_solution_doc(data)
        
    def _architecture_template(self, data: Dict) -> str:
        # Similar structured template for architecture docs
        pass
        
    def _integration_template(self, data: Dict) -> str:
        # Template for integration guides
        pass
        
    def _troubleshooting_template(self, data: Dict) -> str:
        # Template for troubleshooting guides
        pass
        
    def _changelog_template(self, data: Dict) -> str:
        # Template for changelogs
        pass

class LLMExporter:
    """Exports documentation to LLMs with proper context"""
    
    def __init__(self):
        self.export_formats = {
            "claude": self._format_for_claude,
            "gpt4": self._format_for_gpt4,
            "local": self._format_for_local,
            "github": self._format_for_github
        }
        
    def export_to_llm(self, doc_content: str, context: Dict, target: str) -> Dict:
        """Export documentation to specific LLM format"""
        
        if target not in self.export_formats:
            raise ValueError(f"Unknown target: {target}")
            
        return self.export_formats[target](doc_content, context)
        
    def _format_for_claude(self, content: str, context: Dict) -> Dict:
        """Format for Claude API"""
        return {
            "messages": [{
                "role": "user",
                "content": f"""<context>
Project: {context.get('project_name', 'Soulfra')}
Task: {context.get('task', 'Fix issue')}
Previous Context: {context.get('previous_context', 'None')}
</context>

<documentation>
{content}
</documentation>

<request>
{context.get('request', 'Please analyze this documentation and provide implementation code.')}
</request>"""
            }],
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "doc_hash": hashlib.sha256(content.encode()).hexdigest(),
                "context_id": context.get('id', str(uuid.uuid4()))
            }
        }
        
    def _format_for_gpt4(self, content: str, context: Dict) -> Dict:
        """Format for GPT-4 API"""
        return {
            "messages": [
                {
                    "role": "system",
                    "content": f"You are analyzing documentation for {context.get('project_name', 'Soulfra')}. Focus on {context.get('task', 'implementation')}."
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            "functions": context.get('functions', []),
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "context": context
            }
        }
        
    def _format_for_local(self, content: str, context: Dict) -> Dict:
        """Format for local LLM (Ollama, etc)"""
        return {
            "prompt": f"{content}\n\n{context.get('request', 'Implement the recommended solution.')}",
            "system": f"Project context: {json.dumps(context, indent=2)}",
            "temperature": 0.7,
            "max_tokens": 4096
        }
        
    def _format_for_github(self, content: str, context: Dict) -> Dict:
        """Format for GitHub issue/PR"""
        return {
            "title": context.get('title', 'Documentation Update'),
            "body": content,
            "labels": context.get('labels', ['documentation', 'automated']),
            "assignees": context.get('assignees', [])
        }

class GitHubPrivateManager:
    """Manages private GitHub repos and documentation"""
    
    def __init__(self, repo_path: str = None):
        self.repo_path = repo_path or os.getcwd()
        self.private_branch = "soulfra-private-docs"
        
    def ensure_private_branch(self) -> bool:
        """Ensure private documentation branch exists"""
        try:
            # Check if branch exists
            result = subprocess.run(
                ["git", "rev-parse", "--verify", self.private_branch],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )
            
            if result.returncode != 0:
                # Create orphan branch for private docs
                subprocess.run([
                    "git", "checkout", "--orphan", self.private_branch
                ], cwd=self.repo_path)
                
                # Remove all files
                subprocess.run([
                    "git", "rm", "-rf", "."
                ], cwd=self.repo_path)
                
                # Create README
                readme = """# Private Documentation

This branch contains private documentation and LLM exports.
Do not merge into main branches.
"""
                with open(os.path.join(self.repo_path, "README.md"), "w") as f:
                    f.write(readme)
                    
                # Initial commit
                subprocess.run(["git", "add", "README.md"], cwd=self.repo_path)
                subprocess.run([
                    "git", "commit", "-m", "Initialize private documentation branch"
                ], cwd=self.repo_path)
                
            return True
            
        except Exception as e:
            print(f"Error setting up private branch: {e}")
            return False
            
    def save_documentation(self, filename: str, content: str, encrypt: bool = True) -> str:
        """Save documentation to private branch"""
        
        # Switch to private branch
        subprocess.run([
            "git", "checkout", self.private_branch
        ], cwd=self.repo_path)
        
        # Encrypt if requested
        if encrypt:
            content = self._encrypt_content(content)
            filename = f"{filename}.encrypted"
            
        # Save file
        filepath = os.path.join(self.repo_path, "docs", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "w") as f:
            f.write(content)
            
        # Commit
        subprocess.run(["git", "add", filepath], cwd=self.repo_path)
        subprocess.run([
            "git", "commit", "-m", f"Update {filename}"
        ], cwd=self.repo_path)
        
        # Return to previous branch
        subprocess.run(["git", "checkout", "-"], cwd=self.repo_path)
        
        return filepath
        
    def _encrypt_content(self, content: str) -> str:
        """Simple encryption for private content"""
        # In production, use proper encryption
        key = os.environ.get('SOULFRA_ENCRYPTION_KEY', 'default-key')
        # This is a placeholder - use real encryption
        return base64.b64encode(content.encode()).decode()

class SoulfraDocExportSystem:
    """Main system that ties everything together"""
    
    def __init__(self):
        self.generator = DocumentGenerator()
        self.exporter = LLMExporter()
        self.github = GitHubPrivateManager()
        self.db_path = "soulfra_docs.db"
        self.setup_database()
        
    def setup_database(self):
        """Initialize documentation database"""
        conn = sqlite3.connect(self.db_path)
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                type TEXT,
                title TEXT,
                content TEXT,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS exports (
                id TEXT PRIMARY KEY,
                doc_id TEXT,
                target TEXT,
                export_data TEXT,
                response TEXT,
                status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doc_id) REFERENCES documents(id)
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def create_problem_solution(self, problem_data: Dict) -> str:
        """Create a problem/solution document"""
        
        # Generate document
        doc_content = self.generator.generate_problem_solution_doc(problem_data)
        
        # Save to database
        doc_id = self._save_document(
            doc_type="problem_solution",
            title=problem_data['title'],
            content=doc_content,
            metadata=problem_data
        )
        
        # Save to private GitHub
        if self.github.ensure_private_branch():
            filename = f"problems/{problem_data['title'].replace(' ', '_').lower()}.md"
            self.github.save_documentation(filename, doc_content)
            
        return doc_id
        
    def export_to_llm(self, doc_id: str, target: str, context: Dict) -> Dict:
        """Export document to LLM for processing"""
        
        # Get document
        doc = self._get_document(doc_id)
        if not doc:
            raise ValueError(f"Document {doc_id} not found")
            
        # Export to LLM format
        export_data = self.exporter.export_to_llm(
            doc['content'],
            context,
            target
        )
        
        # Save export record
        export_id = self._save_export(
            doc_id=doc_id,
            target=target,
            export_data=export_data,
            status="pending"
        )
        
        return {
            "export_id": export_id,
            "export_data": export_data,
            "doc_id": doc_id
        }
        
    def _save_document(self, doc_type: str, title: str, content: str, metadata: Dict) -> str:
        """Save document to database"""
        conn = sqlite3.connect(self.db_path)
        doc_id = hashlib.sha256(f"{title}{datetime.now()}".encode()).hexdigest()[:16]
        
        conn.execute('''
            INSERT INTO documents (id, type, title, content, metadata)
            VALUES (?, ?, ?, ?, ?)
        ''', (doc_id, doc_type, title, content, json.dumps(metadata)))
        
        conn.commit()
        conn.close()
        
        return doc_id
        
    def _get_document(self, doc_id: str) -> Optional[Dict]:
        """Get document from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            "SELECT * FROM documents WHERE id = ?",
            (doc_id,)
        )
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "id": row[0],
                "type": row[1],
                "title": row[2],
                "content": row[3],
                "metadata": json.loads(row[4]),
                "created_at": row[5],
                "updated_at": row[6]
            }
        return None
        
    def _save_export(self, doc_id: str, target: str, export_data: Dict, status: str) -> str:
        """Save export record"""
        conn = sqlite3.connect(self.db_path)
        export_id = hashlib.sha256(f"{doc_id}{target}{datetime.now()}".encode()).hexdigest()[:16]
        
        conn.execute('''
            INSERT INTO exports (id, doc_id, target, export_data, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (export_id, doc_id, target, json.dumps(export_data), status))
        
        conn.commit()
        conn.close()
        
        return export_id

# Example usage
def create_timeout_solution_example():
    """Create the timeout solution document as an example"""
    
    system = SoulfraDocExportSystem()
    
    # Define the timeout problem
    timeout_problem = {
        "title": "Command Timeout Solution",
        "issues": [
            "Commands timeout after 2 minutes",
            "Silent errors get missed", 
            "Services appear to start but may fail",
            "Can't see real-time logs"
        ],
        "root_cause": "Shell commands have a built-in 2-minute timeout that kills long-running processes",
        "solutions": [
            {
                "name": "Docker Solution",
                "description": "Containerize all services with Docker Compose",
                "benefits": [
                    "NO TIMEOUTS - Each service runs in its own container",
                    "Automatic restart on failure",
                    "Health checks for each service",
                    "Easy log viewing",
                    "Isolated environments"
                ],
                "requirements": [
                    "Docker Desktop installed"
                ]
            },
            {
                "name": "Background Process Solution",
                "description": "Run services in background with process management",
                "benefits": [
                    "No timeout issues",
                    "Services continue after terminal closes"
                ],
                "requirements": [
                    "Python only"
                ]
            }
        ],
        "recommended_solution": {
            "name": "Docker Solution",
            "rationale": "Docker provides the most reliable, production-ready solution with automatic restarts, health checks, and easy management.",
            "steps": [
                {
                    "action": "Install Docker Desktop",
                    "command": None,
                    "note": "Download from docs.docker.com"
                },
                {
                    "action": "Launch all services",
                    "command": "./DOCKER_LAUNCH.sh",
                    "note": "This starts everything with no timeouts"
                },
                {
                    "action": "Monitor services",
                    "command": "docker-compose logs -f",
                    "note": "See all logs in real-time"
                }
            ],
            "results": [
                "All services running reliably",
                "No more timeout issues",
                "Automatic restart on failures",
                "Professional deployment"
            ]
        },
        "status": {
            "Docker files created": True,
            "Services defined": True,
            "Launch script ready": True,
            "Documentation complete": True,
            "Testing required": False
        },
        "verification_commands": """# Check Docker status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart"""
    }
    
    # Create the document
    doc_id = system.create_problem_solution(timeout_problem)
    print(f"Created document: {doc_id}")
    
    # Export to Claude for implementation
    export_result = system.export_to_llm(
        doc_id,
        "claude",
        {
            "project_name": "Soulfra Platform",
            "task": "Implement Docker solution",
            "request": "Please review this timeout solution and provide any improvements or missing components.",
            "previous_context": "We've been struggling with 2-minute timeouts for 40+ patches"
        }
    )
    
    print(f"Exported to Claude: {export_result['export_id']}")
    
    return doc_id, export_result

if __name__ == "__main__":
    print("=" * 60)
    print("SOULFRA DOCUMENTATION EXPORT SYSTEM")
    print("=" * 60)
    print()
    print("This system:")
    print("1. Generates structured documentation")
    print("2. Exports to LLMs with context")
    print("3. Manages private GitHub branches")
    print("4. Tracks all changes")
    print()
    
    # Create example
    doc_id, export = create_timeout_solution_example()
    
    print()
    print("Example created!")
    print(f"Document ID: {doc_id}")
    print(f"Export ID: {export['export_id']}")
    print()
    print("The document has been:")
    print("- Saved to local database")
    print("- Exported to LLM format")
    print("- Ready for private GitHub push")
    print()
    print("This is exactly how all problems should be documented and solved!")