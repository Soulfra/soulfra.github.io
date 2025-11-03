#!/usr/bin/env python3
"""
SOULFRA UNIFIED TERMINAL
Browser-based command center for your agent ecosystem
Like VibeTunnel but for AI agent management
"""

import asyncio
import json
import os
import subprocess
import uuid
from datetime import datetime
from aiohttp import web
import aiohttp_sse
import urllib.request

PORT = 5003

# Project state
PROJECT_STATE = {
    "agents": [],
    "commands": [],
    "phases": {
        "bicycle": {"status": "completed", "features": ["ollama", "basic_agents"]},
        "scooter": {"status": "in_progress", "features": ["chat_processor", "qr_drops"]},
        "motorcycle": {"status": "pending", "features": ["blessing_daemon", "mirror_shell"]},
        "sports_car": {"status": "pending", "features": ["full_daemons", "redis"]},
        "ferrari": {"status": "pending", "features": ["21_tiers", "quantum_loops"]}
    },
    "terminal_output": []
}

def call_ollama(prompt):
    """Call local Ollama"""
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
        return "AI offline - but we can still execute commands"

async def execute_command(cmd):
    """Execute command and stream output"""
    try:
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            shell=True
        )
        
        output = []
        async for line in process.stdout:
            decoded = line.decode('utf-8', errors='replace')
            output.append(decoded)
            PROJECT_STATE['terminal_output'].append({
                'timestamp': datetime.now().isoformat(),
                'line': decoded,
                'cmd': cmd
            })
            
        await process.wait()
        return ''.join(output)
    except Exception as e:
        return f"Error: {str(e)}"

async def index(request):
    """Main dashboard"""
    html = """
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Terminal</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            background: #000; 
            color: #0f8; 
            font-family: 'Courier New', monospace; 
            margin: 0;
            padding: 0;
        }
        .container {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 10px;
            height: 100vh;
            padding: 10px;
        }
        .panel {
            background: #111;
            border: 2px solid #0f8;
            padding: 10px;
            overflow-y: auto;
        }
        .terminal {
            background: #000;
            color: #0f8;
            font-family: monospace;
            padding: 10px;
            height: 400px;
            overflow-y: auto;
            border: 1px solid #0f8;
        }
        .command-input {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        input {
            flex: 1;
            background: #111;
            color: #0f8;
            border: 1px solid #0f8;
            padding: 10px;
            font-family: monospace;
        }
        button {
            background: #0f8;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
        }
        button:hover { background: #0fa; }
        .phase {
            margin: 10px 0;
            padding: 10px;
            border-left: 3px solid #0f8;
        }
        .phase.completed { border-color: #0f0; }
        .phase.in_progress { border-color: #ff0; }
        .phase.pending { border-color: #666; }
        .agent {
            background: #001100;
            padding: 5px;
            margin: 5px 0;
            cursor: pointer;
        }
        .agent:hover { background: #002200; }
        h2 { color: #ff0; margin: 0 0 10px 0; }
        .mobile-nav {
            display: none;
        }
        @media (max-width: 768px) {
            .container {
                grid-template-columns: 1fr;
            }
            .mobile-nav {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }
            .panel {
                display: none;
            }
            .panel.active {
                display: block;
            }
        }
    </style>
</head>
<body>
    <div class="mobile-nav">
        <button onclick="showPanel('status')">Status</button>
        <button onclick="showPanel('terminal')">Terminal</button>
        <button onclick="showPanel('agents')">Agents</button>
    </div>
    
    <div class="container">
        <div class="panel" id="status-panel">
            <h2>🚲→🏎️ Progress</h2>
            <div class="phase completed">
                <strong>Bicycle ✅</strong><br>
                Ollama working
            </div>
            <div class="phase in_progress">
                <strong>Scooter 🛵</strong><br>
                Adding chat processor
            </div>
            <div class="phase pending">
                <strong>Motorcycle 🏍️</strong><br>
                Blessing system
            </div>
            <div class="phase pending">
                <strong>Sports Car 🚗</strong><br>
                Full daemons
            </div>
            <div class="phase pending">
                <strong>Ferrari 🏎️</strong><br>
                21 tiers active
            </div>
        </div>
        
        <div class="panel" id="terminal-panel">
            <h2>🖥️ Terminal</h2>
            <div id="terminal" class="terminal"></div>
            <div class="command-input">
                <input type="text" id="cmd" placeholder="Enter command..." 
                       onkeypress="if(event.key==='Enter') runCommand()">
                <button onclick="runCommand()">Run</button>
            </div>
            
            <h3>Quick Commands:</h3>
            <button onclick="quickCmd('python3 soulfra_working.py')">Start Bicycle</button>
            <button onclick="quickCmd('ps aux | grep python')">Check Processes</button>
            <button onclick="quickCmd('lsof -i :5001')">Check Port</button>
            <button onclick="quickCmd('ollama list')">Check Ollama</button>
        </div>
        
        <div class="panel" id="agents-panel">
            <h2>🤖 Agents</h2>
            <div id="agents"></div>
            <button onclick="createAgent()">Create Agent</button>
            
            <h3>📋 Tasks</h3>
            <div id="tasks">
                <p>• Connect chat processor</p>
                <p>• Enable blessing flow</p>
                <p>• Add QR drops</p>
            </div>
        </div>
    </div>
    
    <script>
        const terminal = document.getElementById('terminal');
        const cmdInput = document.getElementById('cmd');
        let eventSource;
        
        function connect() {
            eventSource = new EventSource('/stream');
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'output') {
                    terminal.innerHTML += data.line;
                    terminal.scrollTop = terminal.scrollHeight;
                } else if (data.type === 'state') {
                    updateUI(data.state);
                }
            };
            
            eventSource.onerror = () => {
                setTimeout(connect, 3000);
            };
        }
        
        async function runCommand() {
            const cmd = cmdInput.value;
            if (!cmd) return;
            
            terminal.innerHTML += `\\n$ ${cmd}\\n`;
            cmdInput.value = '';
            
            const res = await fetch('/execute', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({cmd})
            });
            
            const result = await res.text();
            terminal.innerHTML += result;
            terminal.scrollTop = terminal.scrollHeight;
        }
        
        function quickCmd(cmd) {
            cmdInput.value = cmd;
            runCommand();
        }
        
        async function createAgent() {
            const name = prompt('Agent name:');
            if (!name) return;
            
            const res = await fetch('/create-agent', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name})
            });
            
            const agent = await res.json();
            alert(`Agent ${agent.name} created!`);
        }
        
        function updateUI(state) {
            // Update agents list
            const agentsDiv = document.getElementById('agents');
            agentsDiv.innerHTML = state.agents.map(a => 
                `<div class="agent" onclick="alert('${a.name}: ${a.purpose}')">${a.name}</div>`
            ).join('');
        }
        
        function showPanel(panel) {
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(panel + '-panel').classList.add('active');
        }
        
        // Connect on load
        connect();
        
        // Add keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                cmdInput.focus();
                e.preventDefault();
            }
        });
    </script>
</body>
</html>
"""
    return web.Response(text=html, content_type='text/html')

async def execute_handler(request):
    """Execute command endpoint"""
    data = await request.json()
    cmd = data.get('cmd', '')
    
    # Log command
    PROJECT_STATE['commands'].append({
        'cmd': cmd,
        'timestamp': datetime.now().isoformat()
    })
    
    # Execute
    output = await execute_command(cmd)
    
    return web.Response(text=output)

async def create_agent_handler(request):
    """Create agent with Ollama"""
    data = await request.json()
    name = data.get('name', f'Agent-{len(PROJECT_STATE["agents"])+1}')
    
    # Use Ollama to generate personality
    prompt = f"Create a helpful AI agent named {name}. Give it a unique personality in 10 words."
    personality = call_ollama(prompt)
    
    agent = {
        'id': str(uuid.uuid4()),
        'name': name,
        'purpose': personality[:100],
        'created': datetime.now().isoformat()
    }
    
    PROJECT_STATE['agents'].append(agent)
    
    return web.json_response(agent)

async def stream_handler(request):
    """SSE stream for real-time updates"""
    async with aiohttp_sse.EventSourceResponse() as resp:
        await resp.prepare(request)
        
        try:
            # Send initial state
            await resp.send(json.dumps({
                'type': 'state',
                'state': PROJECT_STATE
            }))
            
            # Keep connection alive
            while True:
                await asyncio.sleep(1)
                
                # Send periodic updates
                if len(PROJECT_STATE['terminal_output']) > 0:
                    latest = PROJECT_STATE['terminal_output'][-1]
                    await resp.send(json.dumps({
                        'type': 'output',
                        'line': latest['line']
                    }))
                
        except Exception:
            pass
            
    return resp

async def mobile_handler(request):
    """Simplified mobile interface"""
    html = """
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Mobile</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <style>
        body { background: #000; color: #0f8; font-family: monospace; margin: 0; padding: 10px; }
        input, button { width: 100%; padding: 15px; margin: 5px 0; font-size: 16px; }
        input { background: #111; color: #0f8; border: 2px solid #0f8; }
        button { background: #0f8; color: #000; border: none; font-weight: bold; }
        .output { background: #111; padding: 10px; margin: 10px 0; min-height: 200px; overflow: auto; }
    </style>
</head>
<body>
    <h2>Soulfra Terminal</h2>
    <input type="text" id="cmd" placeholder="Command...">
    <button onclick="run()">Run</button>
    <div id="output" class="output"></div>
    
    <script>
        async function run() {
            const cmd = document.getElementById('cmd').value;
            const output = document.getElementById('output');
            
            output.innerHTML += `$ ${cmd}\\n`;
            
            const res = await fetch('/execute', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({cmd})
            });
            
            const result = await res.text();
            output.innerHTML += result + '\\n';
            output.scrollTop = output.scrollHeight;
        }
    </script>
</body>
</html>
"""
    return web.Response(text=html, content_type='text/html')

# Create app
app = web.Application()
app.router.add_get('/', index)
app.router.add_get('/mobile', mobile_handler)
app.router.add_post('/execute', execute_handler)
app.router.add_post('/create-agent', create_agent_handler)
app.router.add_get('/stream', stream_handler)

async def start_server():
    """Start the unified terminal"""
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', PORT)
    
    print(f"""
🚀 SOULFRA UNIFIED TERMINAL

Like VibeTunnel but for AI agents!

✅ Features:
- Browser-based terminal (execute any command)
- Real-time output streaming
- AI agent management with Ollama
- Progress tracking (Bicycle→Ferrari)
- Mobile-friendly interface
- No timeouts, async execution

🌐 Access:
- Desktop: http://localhost:{PORT}
- Mobile: http://localhost:{PORT}/mobile
- Remote: Use ngrok/tailscale

⌨️ Shortcuts:
- Ctrl+K: Focus command input

This unifies:
- Terminal access (like VibeTunnel)
- Project management 
- Agent creation
- Real-time monitoring

Press Ctrl+C to stop
""")
    
    await site.start()
    
    # Keep running
    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    # Check dependencies
    try:
        import aiohttp_sse
    except ImportError:
        print("Installing aiohttp-sse...")
        subprocess.run(['pip3', 'install', 'aiohttp', 'aiohttp-sse'])
        print("Please run again!")
        exit(1)
    
    # Run
    asyncio.run(start_server())