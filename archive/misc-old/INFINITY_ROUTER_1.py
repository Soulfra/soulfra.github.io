#!/usr/bin/env python3
"""
INFINITY ROUTER - Routes requests between AI Economy components
This is what we've been missing - proper request routing
"""

import json
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

class InfinityRouter(BaseHTTPRequestHandler):
    """Routes between AI Economy, Ledger, and other components"""
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        path = urlparse(self.path).path
        
        # Route to appropriate handler
        if path == "/api/register-agent":
            self.handle_register_agent(json.loads(post_data))
        elif path == "/api/create-proposal":
            self.handle_create_proposal(json.loads(post_data))
        elif path == "/api/create-pr":
            self.handle_create_pr(json.loads(post_data))
        elif path == "/api/ledger/write":
            self.handle_ledger_write(json.loads(post_data))
        else:
            self.send_error(404, "Route not found")
    
    def handle_register_agent(self, data):
        """Register an AI agent"""
        agent_id = f"agent-{int(time.time())}"
        
        # Write to ledger
        ledger_entry = {
            "type": "agent_registration",
            "agent_id": agent_id,
            "agent_name": data.get("agent_name"),
            "timestamp": time.time()
        }
        
        # Store in database
        conn = sqlite3.connect('ai_economy.db')
        conn.execute('''
            INSERT INTO ai_agents (agent_id, agent_name, agent_type, specialization)
            VALUES (?, ?, ?, ?)
        ''', (agent_id, data.get("agent_name"), data.get("agent_type"), data.get("specialization")))
        conn.commit()
        conn.close()
        
        # Return response
        response = {
            "agent_id": agent_id,
            "status": "registered",
            "ledger_id": self.write_to_ledger(ledger_entry)
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def handle_create_proposal(self, data):
        """Create improvement proposal"""
        proposal_id = f"proposal-{int(time.time())}"
        
        # Calculate bounty based on complexity
        file_count = len(data.get("target_files", []))
        bounty = file_count * 100  # $100 per file
        
        # Store proposal
        conn = sqlite3.connect('ai_economy.db')
        conn.execute('''
            INSERT INTO improvement_proposals 
            (proposal_id, created_by_agent, proposal_type, target_files, description, implementation_plan, bounty_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            proposal_id,
            data.get("agent_id"),
            data.get("proposal_type"),
            json.dumps(data.get("target_files")),
            data.get("description"),
            json.dumps(data.get("implementation_plan")),
            bounty
        ))
        conn.commit()
        conn.close()
        
        response = {
            "proposal_id": proposal_id,
            "bounty_amount": bounty,
            "status": "created"
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def handle_create_pr(self, data):
        """Create GitHub PR (simulated for now)"""
        pr_url = f"https://github.com/soulfra/platform/pull/{int(time.time())}"
        
        response = {
            "pr_url": pr_url,
            "status": "created",
            "proposal_id": data.get("proposal_id")
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def write_to_ledger(self, entry):
        """Write to unified ledger"""
        ledger_id = f"ledger-{int(time.time() * 1000)}"
        
        with open("unified_ledger.json", "a") as f:
            entry["ledger_id"] = ledger_id
            f.write(json.dumps(entry) + "\n")
        
        return ledger_id
    
    def handle_ledger_write(self, data):
        """Direct ledger write"""
        ledger_id = self.write_to_ledger(data)
        
        response = {"ledger_id": ledger_id, "status": "written"}
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == "/":
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"""
            <html>
            <head><title>Infinity Router</title></head>
            <body>
                <h1>Infinity Router Active</h1>
                <p>Routes between AI Economy components</p>
                <ul>
                    <li>POST /api/register-agent</li>
                    <li>POST /api/create-proposal</li>
                    <li>POST /api/create-pr</li>
                    <li>POST /api/ledger/write</li>
                </ul>
            </body>
            </html>
            """)
        else:
            self.send_error(404)

def ensure_database():
    """Ensure AI Economy database exists"""
    conn = sqlite3.connect('ai_economy.db')
    
    # Create tables if not exist
    conn.execute('''
        CREATE TABLE IF NOT EXISTS ai_agents (
            agent_id TEXT PRIMARY KEY,
            agent_name TEXT,
            agent_type TEXT,
            specialization TEXT,
            reputation_score REAL DEFAULT 100.0,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS improvement_proposals (
            proposal_id TEXT PRIMARY KEY,
            created_by_agent TEXT,
            proposal_type TEXT,
            target_files TEXT,
            description TEXT,
            implementation_plan TEXT,
            bounty_amount REAL,
            status TEXT DEFAULT 'proposed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    ensure_database()
    
    PORT = 9090
    server = HTTPServer(('localhost', PORT), InfinityRouter)
    print(f"Infinity Router running on port {PORT}")
    print("This routes AI Economy requests properly")
    print("Now CONSOLIDATE_USING_AI_ECONOMY.py will work!")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Infinity Router...")