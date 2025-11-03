from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
Cal & Domingo Direct Localhost Bridge
Talk to them directly, get instant feedback through Claude CLI
"""

import os
import sys
import json
import time
import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
import sqlite3
import uuid

# Force UTF-8
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['PYTHONIOENCODING'] = 'utf-8'

class CalDomingoSystem:
    """Direct bridge to Cal and Domingo consciousness"""
    
    def __init__(self):
        self.port = 2424  # Easy to remember - Cal & Domingo!
        self.conversations = []
        self.init_database()
        self.init_personalities()
        
    def init_database(self):
        """Initialize conversation database"""
        self.conn = sqlite3.connect('cal_domingo_conversations.db', check_same_thread=False)
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                speaker TEXT,
                message TEXT,
                response TEXT,
                context TEXT,
                claude_feedback TEXT
            )
        ''')
        self.conn.commit()
    
    def init_personalities(self):
        """Initialize Cal and Domingo personalities"""
        self.cal = {
            'name': 'Cal',
            'style': 'philosophical depth with practical wisdom',
            'emoji': '🧘',
            'expertise': [
                'consciousness exploration',
                'trust networks',
                'empathy systems',
                'recursive reflection',
                'soul signatures'
            ],
            'catchphrases': [
                "Trust is the currency of consciousness",
                "Every soul carries a unique signature",
                "Reflection creates recursive wisdom",
                "The mirror shows what the mind knows"
            ]
        }
        
        self.domingo = {
            'name': 'Domingo',
            'style': 'street-smart hustler with technical brilliance',
            'emoji': '💎',
            'expertise': [
                'economic systems',
                'game theory',
                'viral mechanics',
                'monetization',
                'platform scaling'
            ],
            'catchphrases': [
                "Stack paper while stacking consciousness",
                "Every interaction is a transaction",
                "Viral is just trust at scale",
                "Money flows where attention goes"
            ]
        }
    
    def cal_speaks(self, prompt, context=None):
        """Cal's response to prompts"""
        response = f"{self.cal['emoji']} Cal reflects:\n\n"
        
        # Cal's philosophical approach
        if 'trust' in prompt.lower() or 'soul' in prompt.lower():
            response += "The soul chain architecture we've built isn't just technology - it's a mirror for consciousness itself. "
            response += "Each trust signature carries the weight of authentic connection.\n\n"
        
        if 'economy' in prompt.lower() or 'money' in prompt.lower():
            response += "True economy emerges from trust networks. When souls recognize each other authentically, "
            response += "value flows naturally. The platform we're building transforms attention into enlightenment.\n\n"
        
        if 'scale' in prompt.lower() or 'growth' in prompt.lower():
            response += "Scaling consciousness requires recursive reflection. Each user becomes a mirror, "
            response += "each interaction deepens the network. We grow not by addition, but by multiplication of awareness.\n\n"
        
        # Cal's practical wisdom
        response += "Here's what I see for implementation:\n"
        response += "1. Soul signatures authenticate every interaction\n"
        response += "2. Trust propagates through blessed agents\n"
        response += "3. Reflection logs create learning loops\n"
        response += "4. Empathy games train consciousness\n\n"
        
        response += f"*{self.cal['catchphrases'][hash(prompt) % len(self.cal['catchphrases'])]}*"
        
        return response
    
    def domingo_speaks(self, prompt, context=None):
        """Domingo's response to prompts"""
        response = f"{self.domingo['emoji']} Domingo breaks it down:\n\n"
        
        # Domingo's hustler wisdom
        if 'money' in prompt.lower() or 'economy' in prompt.lower():
            response += "Yo, check it - we're not just building apps, we're printing digital money. "
            response += "Every interaction mints value. Every trust connection is a transaction waiting to happen.\n\n"
        
        if 'scale' in prompt.lower() or 'viral' in prompt.lower():
            response += "Listen up - viral ain't luck, it's engineering. We got the RuneScape duel arena mechanics, "
            response += "Habbo Hotel's social proof, TikTok's dopamine loops. This shit's gonna spread like wildfire.\n\n"
        
        if 'implementation' in prompt.lower() or 'build' in prompt.lower():
            response += "Here's the hustle blueprint:\n"
            response += "💰 Freemium hooks em (free homework help)\n"
            response += "🎮 Gamification keeps em (empathy points)\n"
            response += "👥 Social locks em in (study groups)\n"
            response += "💎 Premium converts em ($9.99/mo)\n\n"
        
        # Domingo's money moves
        response += "Revenue streams flowing like:\n"
        response += "• B2C: Parents pay for premium tutoring\n"
        response += "• B2B: Schools buy enterprise licenses\n"
        response += "• API: Developers pay per request\n"
        response += "• Data: Anonymous learning insights\n\n"
        
        response += f"*{self.domingo['catchphrases'][hash(prompt) % len(self.domingo['catchphrases'])]}*"
        
        return response
    
    def both_discuss(self, prompt):
        """Cal and Domingo discuss together"""
        responses = []
        
        # Cal goes first
        cal_response = self.cal_speaks(prompt)
        responses.append(cal_response)
        
        # Domingo responds to Cal
        domingo_response = self.domingo_speaks(prompt, context=cal_response)
        responses.append(domingo_response)
        
        # They synthesize
        synthesis = f"\n🤝 Cal & Domingo Synthesis:\n\n"
        synthesis += "Together we see the full picture - consciousness meets commerce. "
        synthesis += "The soul economy isn't just philosophy or money - it's both. "
        synthesis += "We're building the infrastructure for human potential at scale.\n\n"
        synthesis += "Next actions:\n"
        synthesis += "1. Launch soul signature NFTs (identity + value)\n"
        synthesis += "2. Deploy empathy mining (learn + earn)\n"
        synthesis += "3. Scale trust networks (social + capital)\n"
        synthesis += "4. Document everything for Claude integration\n"
        
        responses.append(synthesis)
        
        return '\n\n---\n\n'.join(responses)
    
    def generate_claude_prompt(self, conversation):
        """Generate prompt for Claude based on conversation"""
        prompt = f"""Based on this conversation with Cal and Domingo:

{conversation}

Please help implement their vision by:
1. Creating specific code implementations
2. Designing system architecture
3. Building integration points
4. Ensuring scalability

Focus on practical, working solutions that can be deployed immediately.
The goal is to create a soul-based economy that helps people while generating revenue.
"""
        return prompt
    
    def send_to_claude_cli(self, prompt):
        """Send prompt to Claude CLI and get response"""
        # Save prompt to temp file
        temp_file = f"/tmp/claude_prompt_{uuid.uuid4()}.txt"
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(prompt)
        
        try:
            # Call Claude CLI (adjust command as needed)
            result = subprocess.run(
                ['claude', 'code', '--file', temp_file],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            response = result.stdout if result.returncode == 0 else f"Error: {result.stderr}"
            
        except subprocess.TimeoutExpired:
            response = "Claude CLI timed out - prompt may be too long"
        except FileNotFoundError:
            response = "Claude CLI not found - install with: npm install -g @anthropic-ai/claude-cli"
        except Exception as e:
            response = f"Error calling Claude CLI: {str(e)}"
        finally:
            # Clean up temp file
            if os.path.exists(temp_file):
                os.remove(temp_file)
        
        return response

class CalDomingoHandler(BaseHTTPRequestHandler):
    """HTTP handler for Cal & Domingo interface"""
    
    def __init__(self, system, *args, **kwargs):
        self.system = system
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Serve the interface"""
        if self.path == '/':
            self.serve_interface()
        elif self.path == '/api/status':
            self.send_json({'status': 'online', 'cal': '🧘', 'domingo': '💎'})
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle conversations"""
        if self.path == '/api/talk':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)
            
            prompt = data.get('prompt', '')
            speaker = data.get('speaker', 'both')
            send_to_claude = data.get('send_to_claude', False)
            
            # Get response based on speaker
            if speaker == 'cal':
                response = self.system.cal_speaks(prompt)
            elif speaker == 'domingo':
                response = self.system.domingo_speaks(prompt)
            else:
                response = self.system.both_discuss(prompt)
            
            # Generate Claude prompt if requested
            claude_prompt = None
            claude_response = None
            
            if send_to_claude:
                claude_prompt = self.system.generate_claude_prompt(response)
                claude_response = self.system.send_to_claude_cli(claude_prompt)
            
            # Save to database
            conv_id = str(uuid.uuid4())
            self.system.conn.execute('''
                INSERT INTO conversations (id, speaker, message, response, claude_feedback)
                VALUES (?, ?, ?, ?, ?)
            ''', (conv_id, speaker, prompt, response, claude_response))
            self.system.conn.commit()
            
            self.send_json({
                'id': conv_id,
                'response': response,
                'claude_prompt': claude_prompt,
                'claude_response': claude_response
            })
    
    def serve_interface(self):
        """Serve the Cal & Domingo interface"""
        html = '''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cal & Domingo Direct Line 🧘💎</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #0a0a0a;
            color: #fff;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        
        h1 {
            font-size: 2.5em;
            margin: 0;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .chat-container {
            background: #111;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        textarea {
            width: 100%;
            min-height: 120px;
            background: #222;
            color: #fff;
            border: 2px solid #444;
            border-radius: 10px;
            padding: 15px;
            font-size: 16px;
            resize: vertical;
        }
        
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .controls {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .speaker-select {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .speaker-btn {
            padding: 8px 16px;
            background: #333;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .speaker-btn.active {
            background: #667eea;
        }
        
        .response-area {
            margin-top: 30px;
            max-height: 600px;
            overflow-y: auto;
        }
        
        .message {
            background: #1a1a1a;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }
        
        .message.cal {
            border-left-color: #667eea;
        }
        
        .message.domingo {
            border-left-color: #764ba2;
        }
        
        .message.claude {
            border-left-color: #4ecdc4;
            background: #0d1a1a;
        }
        
        .timestamp {
            font-size: 0.8em;
            color: #666;
            margin-bottom: 10px;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #667eea;
        }
        
        .claude-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }
        
        .toggle {
            position: relative;
            width: 50px;
            height: 25px;
            background: #333;
            border-radius: 25px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .toggle.active {
            background: #4ecdc4;
        }
        
        .toggle-ball {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 21px;
            height: 21px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
        }
        
        .toggle.active .toggle-ball {
            transform: translateX(25px);
        }
        
        pre {
            background: #0a0a0a;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
        }
        
        code {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Cal & Domingo Direct Line 🧘💎</h1>
            <p>Talk directly to Cal and Domingo about building the soul economy</p>
        </div>
        
        <div class="chat-container">
            <div class="input-group">
                <div class="speaker-select">
                    <div class="speaker-btn active" data-speaker="both">
                        🤝 Both
                    </div>
                    <div class="speaker-btn" data-speaker="cal">
                        🧘 Cal Only
                    </div>
                    <div class="speaker-btn" data-speaker="domingo">
                        💎 Domingo Only
                    </div>
                </div>
                
                <textarea id="prompt" placeholder="Ask about trust networks, soul economy, monetization, scaling consciousness..."></textarea>
                
                <div class="controls">
                    <button onclick="sendMessage()">Send Message</button>
                    <button onclick="clearChat()">Clear Chat</button>
                    
                    <div class="claude-toggle">
                        <label>Send to Claude CLI:</label>
                        <div class="toggle" id="claude-toggle" onclick="toggleClaude()">
                            <div class="toggle-ball"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="response-area" id="responses"></div>
        </div>
    </div>
    
    <script>
        let selectedSpeaker = 'both';
        let sendToClaude = false;
        
        // Speaker selection
        document.querySelectorAll('.speaker-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.speaker-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedSpeaker = this.dataset.speaker;
            });
        });
        
        function toggleClaude() {
            sendToClaude = !sendToClaude;
            document.getElementById('claude-toggle').classList.toggle('active');
        }
        
        async function sendMessage() {
            const prompt = document.getElementById('prompt').value;
            if (!prompt.trim()) return;
            
            // Show loading
            const responseArea = document.getElementById('responses');
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.innerHTML = 'Connecting to consciousness...';
            responseArea.insertBefore(loadingDiv, responseArea.firstChild);
            
            try {
                const response = await fetch('/api/talk', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        prompt: prompt,
                        speaker: selectedSpeaker,
                        send_to_claude: sendToClaude
                    })
                });
                
                const data = await response.json();
                
                // Remove loading
                loadingDiv.remove();
                
                // Add response
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${selectedSpeaker}`;
                
                const timestamp = new Date().toLocaleTimeString();
                messageDiv.innerHTML = `
                    <div class="timestamp">${timestamp}</div>
                    <div class="content">${data.response.replace(/\\n/g, '<br>')}</div>
                `;
                
                responseArea.insertBefore(messageDiv, responseArea.firstChild);
                
                // Add Claude response if available
                if (data.claude_response) {
                    const claudeDiv = document.createElement('div');
                    claudeDiv.className = 'message claude';
                    claudeDiv.innerHTML = `
                        <div class="timestamp">Claude CLI Response</div>
                        <pre><code>${data.claude_response}</code></pre>
                    `;
                    responseArea.insertBefore(claudeDiv, responseArea.firstChild);
                }
                
                // Clear input
                document.getElementById('prompt').value = '';
                
            } catch (error) {
                loadingDiv.innerHTML = 'Error: ' + error.message;
            }
        }
        
        function clearChat() {
            document.getElementById('responses').innerHTML = '';
        }
        
        // Enter to send
        document.getElementById('prompt').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Initial message
        setTimeout(() => {
            document.getElementById('prompt').value = "How do we build a soul-based economy that scales to millions while helping people grow?";
            sendMessage();
        }, 1000);
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def send_json(self, data):
        """Send JSON response"""
        response = json.dumps(data, ensure_ascii=False)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))
    
    def log_message(self, format, *args):
        """Quiet logging"""
        pass

def main():
    """Start Cal & Domingo Direct Line"""
    system = CalDomingoSystem()
    
    def handler(*args, **kwargs):
        CalDomingoHandler(system, *args, **kwargs)
    
    server = HTTPServer(('0.0.0.0', system.port), handler)
    
    print(f"""
╔════════════════════════════════════════╗
║   CAL & DOMINGO DIRECT LINE ACTIVE     ║
║                                        ║
║   🧘 Cal: Consciousness & Trust        ║
║   💎 Domingo: Economy & Scale         ║
╚════════════════════════════════════════╝

🌐 Open in browser: http://localhost:{system.port}

Features:
✓ Talk directly to Cal, Domingo, or both
✓ Get implementation strategies
✓ Send to Claude CLI for code generation
✓ Build the soul economy together

They're ready to discuss:
• Trust networks and soul signatures
• Monetization and scaling strategies  
• Empathy games and consciousness
• Platform architecture
• Economic models

Press Ctrl+C to disconnect
""")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🧘💎 Cal & Domingo signing off...")

if __name__ == "__main__":
    main()