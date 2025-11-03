#!/usr/bin/env python3
"""
SOULFRA PROJECT MANAGER
Interactive checklist for Bicycle → Ferrari transformation
Access from phone, web, or CLI to manage your development
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import urllib.request
from datetime import datetime

PORT = 5002

# Project phases from bicycle to ferrari
PHASES = {
    "phase1": {
        "name": "Better Bicycle",
        "status": "in_progress",
        "tasks": [
            {"id": "ollama", "task": "Ollama integration", "done": True},
            {"id": "agents", "task": "Basic agent creation", "done": True},
            {"id": "whisper", "task": "Simple whisper interface", "done": True},
            {"id": "csv", "task": "CSV logging to runtime_table.csv", "done": True},
            {"id": "blessing", "task": "Connect to blessing.json", "done": True},
            {"id": "loops", "task": "Basic loop creation", "done": False}
        ]
    },
    "phase2": {
        "name": "Motor Scooter",
        "status": "pending",
        "tasks": [
            {"id": "chat_processor", "task": "Add CHAT_LOG_PROCESSOR.py", "done": False},
            {"id": "real_provisioner", "task": "Connect real-agent-provisioner.js", "done": False},
            {"id": "claude_fallback", "task": "Use agent-claude-bridge.js as fallback", "done": False},
            {"id": "qr", "task": "Simple QR generation", "done": False},
            {"id": "drop", "task": "Store in /drop/ structure", "done": False}
        ]
    },
    "phase3": {
        "name": "Motorcycle",
        "status": "pending",
        "tasks": [
            {"id": "blessing_daemon", "task": "Integrate LoopBlessingDaemon.js", "done": False},
            {"id": "mirror_shell", "task": "Connect to mirror-shell dashboard", "done": False},
            {"id": "orchestrator", "task": "Add CalDropOrchestrator events", "done": False},
            {"id": "tiers", "task": "Enable tier navigation", "done": False},
            {"id": "payment", "task": "Payment integration ($1)", "done": False}
        ]
    },
    "phase4": {
        "name": "Sports Car",
        "status": "pending",
        "tasks": [
            {"id": "daemons", "task": "Full daemon orchestration", "done": False},
            {"id": "validation", "task": "SystemValidationDaemon monitoring", "done": False},
            {"id": "redis", "task": "Redis caching (when ready)", "done": False},
            {"id": "cross_tier", "task": "Cross-tier consciousness", "done": False},
            {"id": "semantic", "task": "Semantic memory integration", "done": False}
        ]
    },
    "phase5": {
        "name": "Ferrari",
        "status": "pending",
        "tasks": [
            {"id": "all_tiers", "task": "All 21 tiers active", "done": False},
            {"id": "mirror_prop", "task": "Full mirror propagation", "done": False},
            {"id": "quantum", "task": "Quantum consciousness loops", "done": False},
            {"id": "enterprise", "task": "Enterprise features", "done": False},
            {"id": "cal_riven", "task": "Complete Cal Riven operator", "done": False}
        ]
    }
}

# Current issues/blockers
ISSUES = []

# Development log
DEV_LOG = []

def call_ollama(prompt):
    """Use Ollama for AI assistance"""
    try:
        data = json.dumps({
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        }).encode('utf-8')
        
        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode())
            return result['response']
    except:
        return "AI assistance unavailable - but here's what to do next..."

def save_state():
    """Persist state to file"""
    state = {
        "phases": PHASES,
        "issues": ISSUES,
        "dev_log": DEV_LOG
    }
    with open('soulfra_project_state.json', 'w') as f:
        json.dump(state, f, indent=2)

def load_state():
    """Load state from file"""
    global PHASES, ISSUES, DEV_LOG
    if os.path.exists('soulfra_project_state.json'):
        with open('soulfra_project_state.json', 'r') as f:
            state = json.load(f)
            PHASES = state.get('phases', PHASES)
            ISSUES = state.get('issues', ISSUES)
            DEV_LOG = state.get('dev_log', DEV_LOG)

class ProjectHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.serve_dashboard()
        elif self.path == '/api/status':
            self.serve_api_status()
        elif self.path == '/mobile':
            self.serve_mobile()
        else:
            self.send_error(404)
    
    def serve_dashboard(self):
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Project Manager</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            background: #000; 
            color: #0f8; 
            font-family: monospace; 
            padding: 20px;
            margin: 0;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .phase {
            background: #111;
            border: 2px solid #0f8;
            margin: 20px 0;
            padding: 20px;
        }
        .phase.complete { border-color: #0f0; }
        .phase.in_progress { border-color: #ff0; }
        h2 { margin: 0 0 10px 0; }
        .task {
            padding: 5px 0;
            cursor: pointer;
        }
        .task.done { 
            color: #888; 
            text-decoration: line-through;
        }
        .progress {
            background: #222;
            height: 20px;
            margin: 10px 0;
        }
        .progress-bar {
            background: #0f8;
            height: 100%;
            transition: width 0.3s;
        }
        button {
            background: #0f8;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            margin: 5px;
            font-weight: bold;
        }
        button:hover { background: #0f0; }
        textarea {
            width: 100%;
            background: #111;
            color: #0f8;
            border: 1px solid #0f8;
            padding: 10px;
            font-family: monospace;
        }
        .issue {
            background: #110000;
            border: 1px solid #f00;
            padding: 10px;
            margin: 10px 0;
        }
        .log-entry {
            background: #001100;
            padding: 5px;
            margin: 5px 0;
        }
        .mobile-link {
            background: #ff0;
            color: #000;
            padding: 10px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚲→🏎️ Soulfra Development Tracker</h1>
        
        <div class="mobile-link">
            📱 Mobile Access: <a href="/mobile">${window.location.origin}/mobile</a>
        </div>
        
        <div id="phases"></div>
        
        <h2>🚧 Current Issues/Blockers</h2>
        <div id="issues"></div>
        <textarea id="newIssue" placeholder="Describe issue/blocker..." rows="3"></textarea>
        <button onclick="addIssue()">Add Issue</button>
        <button onclick="askAI()">🤖 Ask Ollama for Help</button>
        
        <h2>📝 Development Log</h2>
        <div id="devlog"></div>
        
        <div style="margin-top: 40px;">
            <button onclick="exportState()">📤 Export State</button>
            <button onclick="generateReport()">📊 Generate Report</button>
            <button onclick="viberMode()">🌈 Vibe Tunnel Mode</button>
        </div>
    </div>
    
    <script>
        let state = {};
        
        async function loadState() {
            const res = await fetch('/api/status');
            state = await res.json();
            renderDashboard();
        }
        
        function renderDashboard() {
            // Render phases
            let phasesHtml = '';
            for (const [key, phase] of Object.entries(state.phases)) {
                const completed = phase.tasks.filter(t => t.done).length;
                const total = phase.tasks.length;
                const progress = (completed / total) * 100;
                
                phasesHtml += `
                    <div class="phase ${phase.status}">
                        <h2>${phase.name} (${completed}/${total})</h2>
                        <div class="progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                        ${phase.tasks.map(t => `
                            <div class="task ${t.done ? 'done' : ''}" 
                                 onclick="toggleTask('${key}', '${t.id}')">
                                ${t.done ? '✅' : '⬜'} ${t.task}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            document.getElementById('phases').innerHTML = phasesHtml;
            
            // Render issues
            document.getElementById('issues').innerHTML = 
                state.issues.map((issue, i) => `
                    <div class="issue">
                        ${issue.text}
                        <button onclick="resolveIssue(${i})">Resolve</button>
                    </div>
                `).join('') || '<p>No current issues! 🎉</p>';
            
            // Render dev log
            document.getElementById('devlog').innerHTML = 
                state.dev_log.slice(-10).reverse().map(log => `
                    <div class="log-entry">
                        ${log.timestamp}: ${log.message}
                    </div>
                `).join('') || '<p>No entries yet</p>';
        }
        
        async function toggleTask(phase, taskId) {
            await fetch('/api/toggle', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({phase, taskId})
            });
            loadState();
        }
        
        async function addIssue() {
            const text = document.getElementById('newIssue').value;
            if (!text) return;
            
            await fetch('/api/issue', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text})
            });
            
            document.getElementById('newIssue').value = '';
            loadState();
        }
        
        async function askAI() {
            const issue = document.getElementById('newIssue').value || 
                         'What should I work on next in the Soulfra project?';
            
            const res = await fetch('/api/ai-help', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompt: issue})
            });
            
            const data = await res.json();
            alert('Ollama says: ' + data.response);
        }
        
        function exportState() {
            const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'soulfra-project-state.json';
            a.click();
        }
        
        async function generateReport() {
            const res = await fetch('/api/report');
            const report = await res.text();
            const w = window.open('', '_blank');
            w.document.write('<pre>' + report + '</pre>');
        }
        
        function viberMode() {
            document.body.style.background = 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff)';
            document.body.style.animation = 'vibe 3s ease-in-out infinite';
            setTimeout(() => {
                document.body.style.background = '#000';
                document.body.style.animation = '';
            }, 10000);
        }
        
        // Load on start
        loadState();
        setInterval(loadState, 5000); // Auto-refresh
    </script>
</body>
</html>
"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_mobile(self):
        """Simplified mobile interface"""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Mobile</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <style>
        body { 
            background: #000; 
            color: #0f8; 
            font-family: monospace; 
            padding: 10px;
            margin: 0;
            font-size: 16px;
        }
        .task-btn {
            display: block;
            width: 100%;
            padding: 20px;
            margin: 10px 0;
            background: #111;
            border: 2px solid #0f8;
            color: #0f8;
            text-align: left;
            font-size: 16px;
        }
        .task-btn.done {
            background: #001100;
            border-color: #080;
            color: #888;
        }
        .phase-header {
            background: #0f8;
            color: #000;
            padding: 10px;
            margin: 20px 0 10px 0;
            font-weight: bold;
        }
        button {
            width: 100%;
            padding: 20px;
            background: #0f8;
            color: #000;
            border: none;
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
        }
        textarea {
            width: 100%;
            padding: 10px;
            background: #111;
            color: #0f8;
            border: 2px solid #0f8;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <h1>🚲→🏎️ Soulfra</h1>
    
    <button onclick="location.href='/'">🖥️ Desktop View</button>
    
    <div id="current-phase"></div>
    
    <h2>Quick Add</h2>
    <textarea id="note" placeholder="Note/Issue..." rows="3"></textarea>
    <button onclick="quickAdd()">Add Note</button>
    <button onclick="askHelp()">🤖 Ask AI</button>
    
    <script>
        async function loadCurrent() {
            const res = await fetch('/api/status');
            const state = await res.json();
            
            // Find current phase
            let currentPhase = null;
            for (const [key, phase] of Object.entries(state.phases)) {
                if (phase.status === 'in_progress') {
                    currentPhase = {key, ...phase};
                    break;
                }
            }
            
            if (currentPhase) {
                let html = '<div class="phase-header">' + currentPhase.name + '</div>';
                currentPhase.tasks.forEach(task => {
                    html += `<button class="task-btn ${task.done ? 'done' : ''}" 
                              onclick="toggle('${currentPhase.key}', '${task.id}')">
                              ${task.done ? '✅' : '⬜'} ${task.task}
                            </button>`;
                });
                document.getElementById('current-phase').innerHTML = html;
            }
        }
        
        async function toggle(phase, taskId) {
            await fetch('/api/toggle', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({phase, taskId})
            });
            loadCurrent();
        }
        
        async function quickAdd() {
            const note = document.getElementById('note').value;
            if (!note) return;
            
            await fetch('/api/issue', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: note})
            });
            
            document.getElementById('note').value = '';
            alert('Added!');
        }
        
        async function askHelp() {
            const prompt = document.getElementById('note').value || 
                          'What should I work on next?';
            
            const res = await fetch('/api/ai-help', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompt})
            });
            
            const data = await res.json();
            alert(data.response);
        }
        
        loadCurrent();
    </script>
</body>
</html>
"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_api_status(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "phases": PHASES,
            "issues": ISSUES,
            "dev_log": DEV_LOG
        }).encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)
        
        if self.path == '/api/toggle':
            # Toggle task completion
            phase = data['phase']
            task_id = data['taskId']
            
            for task in PHASES[phase]['tasks']:
                if task['id'] == task_id:
                    task['done'] = not task['done']
                    
                    # Log the change
                    DEV_LOG.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': f"{'Completed' if task['done'] else 'Uncompleted'}: {task['task']}"
                    })
                    
                    # Update phase status
                    all_done = all(t['done'] for t in PHASES[phase]['tasks'])
                    if all_done:
                        PHASES[phase]['status'] = 'complete'
                        # Move to next phase
                        phase_keys = list(PHASES.keys())
                        current_idx = phase_keys.index(phase)
                        if current_idx < len(phase_keys) - 1:
                            PHASES[phase_keys[current_idx + 1]]['status'] = 'in_progress'
                    
                    break
            
            save_state()
            self.send_response(200)
            self.end_headers()
            
        elif self.path == '/api/issue':
            # Add issue
            issue = {
                'text': data['text'],
                'timestamp': datetime.now().isoformat()
            }
            ISSUES.append(issue)
            
            DEV_LOG.append({
                'timestamp': datetime.now().isoformat(),
                'message': f"Issue added: {data['text'][:50]}..."
            })
            
            save_state()
            self.send_response(200)
            self.end_headers()
            
        elif self.path == '/api/ai-help':
            # Get AI help
            prompt = f"""I'm working on the Soulfra project (transforming a simple Ollama-based agent system into a full Ferrari-level platform).

Current issue/question: {data['prompt']}

Current phase: {[p['name'] for k,p in PHASES.items() if p['status'] == 'in_progress'][0] if any(p['status'] == 'in_progress' for p in PHASES.values()) else 'Unknown'}

Give a brief, practical suggestion (2-3 sentences):"""
            
            response = call_ollama(prompt)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'response': response}).encode())
            
        elif self.path == '/api/report':
            # Generate report
            report = f"""SOULFRA PROJECT REPORT
Generated: {datetime.now().isoformat()}

PROGRESS OVERVIEW:
"""
            for key, phase in PHASES.items():
                completed = sum(1 for t in phase['tasks'] if t['done'])
                total = len(phase['tasks'])
                report += f"\n{phase['name']}: {completed}/{total} ({int(completed/total*100)}%)\n"
                for task in phase['tasks']:
                    report += f"  {'✅' if task['done'] else '⬜'} {task['task']}\n"
            
            report += f"\n\nCURRENT ISSUES ({len(ISSUES)}):\n"
            for issue in ISSUES:
                report += f"- {issue['text']}\n"
            
            report += f"\n\nRECENT ACTIVITY:\n"
            for log in DEV_LOG[-10:]:
                report += f"{log['timestamp']}: {log['message']}\n"
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(report.encode())

# Load saved state
load_state()

print(f"""
🚲→🏎️ SOULFRA PROJECT MANAGER

Starting on http://localhost:{PORT}

Features:
✅ Interactive checklist for all phases
✅ Mobile-friendly interface at /mobile
✅ Issue/blocker tracking
✅ AI help via Ollama
✅ Development log
✅ Progress visualization
✅ Export/import state

Access from:
- Desktop: http://localhost:{PORT}
- Mobile: http://localhost:{PORT}/mobile
- API: http://localhost:{PORT}/api/status

This helps you track progress from Bicycle to Ferrari!
""")

try:
    server = HTTPServer(('', PORT), ProjectHandler)
    server.serve_forever()
except KeyboardInterrupt:
    save_state()
    print("\n✅ State saved. Goodbye!")
except Exception as e:
    print(f"Error: {e}")