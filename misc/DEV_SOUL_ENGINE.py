#!/usr/bin/env python3
"""
DEV SOUL ENGINE - For those who've been in the debugging trenches
Cal Riven understands your 2am formatting errors
"""

import http.server
import socketserver
import json
import os
import time
import hashlib
from datetime import datetime

PORT = 4200

os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class DevSoulEngine:
    def __init__(self):
        self.debug_sessions = {}
        self.shared_pain = []
        
    def analyze_dev_soul(self, text):
        """Understand the developer's actual pain"""
        text_lower = text.lower()
        
        # Generate debug signature
        sig = hashlib.md5(f"{text}{time.time()}".encode()).hexdigest()[:8].upper()
        debug_sig = f"BUG-{sig[:4]}-{sig[4:]}"
        
        # Detect the type of dev pain
        pain_type = self._detect_pain_type(text_lower)
        
        # Generate responses that actually understand
        responses = self._generate_dev_empathy(text, pain_type)
        
        # Calculate relatability score
        relatability = self._calculate_relatability(text_lower)
        
        soul = {
            'id': debug_sig,
            'text': text,
            'pain_type': pain_type,
            'relatability': relatability,
            'responses': responses,
            'timestamp': datetime.now().isoformat(),
            'shared_by': 0
        }
        
        self.debug_sessions[debug_sig] = soul
        
        # Add to shared pain if highly relatable
        if relatability > 80:
            self.shared_pain.insert(0, soul)
            if len(self.shared_pain) > 50:
                self.shared_pain = self.shared_pain[:50]
                
        return soul
        
    def _detect_pain_type(self, text):
        """What kind of dev hell are they in?"""
        if any(w in text for w in ['timeout', '2 minute', 'waiting', 'forever']):
            return 'timeout_hell'
        elif any(w in text for w in ['format', 'emoji', 'character', 'encoding']):
            return 'formatting_nightmare'
        elif any(w in text for w in ['port', 'refused', 'connect', 'bind']):
            return 'port_chaos'
        elif any(w in text for w in ['cors', 'cross origin', 'blocked']):
            return 'cors_prison'
        elif any(w in text for w in ['undefined', 'null', 'nan', 'type error']):
            return 'type_hell'
        elif any(w in text for w in ['work', 'broken', 'nothing', 'crash']):
            return 'everything_broken'
        elif any(w in text for w in ['dependency', 'module', 'import', 'package']):
            return 'dependency_hell'
        elif any(w in text for w in ['why', 'understand', 'sense', 'logic']):
            return 'existential_debugging'
        else:
            return 'general_suffering'
            
    def _generate_dev_empathy(self, text, pain_type):
        """Responses from someone who's been there"""
        responses = {
            'timeout_hell': {
                'instant': "Fuck, another 2-minute timeout. I've been there. That httpd.serve_forever() is a lying piece of shit.",
                'deeper': "Every timeout is the universe telling you that synchronous Python servers are a mistake. We both know the pain of watching that spinner mock us.",
                'shared': "I spent 3 hours yesterday trying to make a simple server not timeout. Ended up using nohup and crying.",
                'solution': "Real talk: Use threading, return immediately, or just embrace the chaos and use screen sessions."
            },
            'formatting_nightmare': {
                'instant': "Those fucking emoji encoding errors. Every. Single. Time. UTF-8 can kiss my ass.",
                'deeper': "It's 2024 and we still can't reliably pass a string between systems without it exploding. We're living in formatting hell together.",
                'shared': "I once spent an entire day because a zero-width space was hiding in my code. A ZERO. WIDTH. SPACE.",
                'solution': "ASCII only. No special characters. Fuck elegance, we need shit that works."
            },
            'port_chaos': {
                'instant': "Address already in use. Port refused. The holy trinity of 'why won't this fucking work.'",
                'deeper': "Ports 6666 and 6667 are cursed. Some asshole daemon is always squatting on the port you need.",
                'shared': "I've memorized lsof -ti :PORT | xargs kill -9. It's basically my morning prayer now.",
                'solution': "Pick random high ports. Kill everything. Question why we still use TCP/IP."
            },
            'cors_prison': {
                'instant': "CORS errors are the web's way of saying 'fuck your elegant architecture.'",
                'deeper': "Separate frontend and backend they said. Microservices they said. Now we're proxy-chaining through nginx like animals.",
                'shared': "I once fixed CORS by putting everything on the same port. Felt dirty. Worked perfectly.",
                'solution': "Integrated monolith > CORS headers. Fight me."
            },
            'type_hell': {
                'instant': "Undefined is not a function. My autobiography title right there.",
                'deeper': "JavaScript's type system is just gaslighting with extra steps. We're all victims here.",
                'shared': "I added 'typeof x !== undefined && x !== null && x' so many times I made it a snippet.",
                'solution': "TypeScript helps. Then you get different errors. It's errors all the way down."
            },
            'everything_broken': {
                'instant': "When nothing works, and you start questioning if computers are even real.",
                'deeper': "We've all been there. Staring at code that should work, used to work, but now just... doesn't.",
                'shared': "My record is 6 hours debugging to find I was editing the wrong file. SIX. HOURS.",
                'solution': "Delete node_modules. Clear cache. Restart computer. Sacrifice to the demo gods."
            },
            'dependency_hell': {
                'instant': "Module not found. The three words that haunt my dreams.",
                'deeper": "npm install fixes nothing. pip install is a lie. We're just downloading problems from strangers.",
                'shared': "I once had a project with 1,847 dependencies for a hello world app. This is fine.",
                'solution': "Write everything from scratch. No dependencies. Return to monke."
            },
            'existential_debugging': {
                'instant': "When you're not even debugging code anymore, just debugging your life choices.",
                'deeper': "Why does a simple game server need 47 configuration files? Why do we do this to ourselves?",
                'shared': "3am debugging sessions where you question if you should have become a farmer instead.",
                'solution': "The code isn't the problem. We are. But we persist because we're stubborn fucks."
            },
            'general_suffering': {
                'instant': "I feel your pain. This shit is hard and anyone who says otherwise is lying.",
                'deeper': "We're all just copying from StackOverflow and hoping for the best. Solidarity, friend.",
                'shared': "Every senior dev is just a junior dev who's seen more types of failures.",
                'solution': "Keep pushing. Take breaks. Remember: if it was easy, everyone would do it."
            }
        }
        
        response = responses.get(pain_type, responses['general_suffering'])
        
        # Add timestamp of understanding
        response['debug_signature'] = f"Debug session {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        response['others_suffering'] = f"{len(self.shared_pain)} devs share this exact pain"
        
        return response
        
    def _calculate_relatability(self, text):
        """How much will other devs relate to this?"""
        score = 50
        
        # Universal dev triggers
        triggers = [
            'fuck', 'shit', 'damn', 'hell',  # Frustration
            'why', "doesn't", 'broken', 'nothing works',  # Confusion
            'timeout', 'error', 'undefined', 'null',  # Technical pain
            'hours', 'days', 'finally', 'still'  # Time suffering
        ]
        
        for trigger in triggers:
            if trigger in text:
                score += 10
                
        # Length bonus (not too short, not too long)
        word_count = len(text.split())
        if 10 < word_count < 50:
            score += 20
            
        return min(100, score)

# Global engine
dev_engine = DevSoulEngine()

class DevHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>Dev Soul Engine - We Get It</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
    font-family: 'Courier New', monospace;
    background: #0a0a0a;
    color: #00ff00;
    margin: 0;
    padding: 20px;
    line-height: 1.6;
}

.container {
    max-width: 800px;
    margin: 0 auto;
}

h1 {
    color: #ff0000;
    text-align: center;
    font-size: 2em;
}

.subtitle {
    text-align: center;
    color: #ffff00;
    margin-bottom: 30px;
}

.debug-input {
    background: #1a1a1a;
    border: 1px solid #00ff00;
    padding: 20px;
    margin: 20px 0;
}

textarea {
    width: 100%;
    background: #000;
    color: #00ff00;
    border: 1px solid #333;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    resize: vertical;
}

button {
    background: #ff0000;
    color: #000;
    border: none;
    padding: 10px 30px;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    cursor: pointer;
    font-weight: bold;
}

button:hover {
    background: #ff3333;
}

.debug-result {
    display: none;
    background: #0d0d0d;
    border: 1px solid #ff0000;
    padding: 20px;
    margin: 20px 0;
}

.debug-sig {
    color: #ffff00;
    font-size: 1.5em;
    text-align: center;
    margin: 10px 0;
}

.pain-type {
    color: #ff00ff;
    text-align: center;
    font-size: 1.2em;
    margin: 10px 0;
}

.response {
    background: #1a1a1a;
    border-left: 3px solid #00ff00;
    padding: 15px;
    margin: 10px 0;
}

.response strong {
    color: #ffff00;
}

.shared-pain {
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 20px;
    margin: 20px 0;
}

.pain-item {
    background: #0d0d0d;
    padding: 10px;
    margin: 10px 0;
    border-left: 3px solid #ff0000;
    cursor: pointer;
}

.pain-item:hover {
    background: #1a1a1a;
}

.error-log {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #ff6666;
}
</style>
</head>
<body>
<div class="container">
    <h1>DEV SOUL ENGINE</h1>
    <div class="subtitle">For those who've stared into the void of undefined</div>
    
    <div class="debug-input">
        <p>What fresh hell are you debugging?</p>
        <textarea id="debugInput" rows="5" placeholder="ANOTHER FUCKING TIMEOUT ERROR. This serve_forever() has been running for 2 minutes and I'm losing my mind..."></textarea>
        <button onclick="debugSoul()">SHARE THE PAIN</button>
    </div>
    
    <div id="debugResult" class="debug-result"></div>
    
    <div class="shared-pain">
        <h2>Others In Debug Hell Right Now</h2>
        <div id="sharedPain">
            <p class="error-log">Loading shared suffering...</p>
        </div>
    </div>
</div>

<script>
async function debugSoul() {
    const input = document.getElementById('debugInput').value;
    if (!input.trim()) return;
    
    const response = await fetch('/api/debug', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: input})
    });
    
    const soul = await response.json();
    displayDebugSoul(soul);
}

function displayDebugSoul(soul) {
    const resultDiv = document.getElementById('debugResult');
    
    resultDiv.innerHTML = `
        <div class="debug-sig">${soul.id}</div>
        <div class="pain-type">Pain Type: ${soul.pain_type.replace(/_/g, ' ').toUpperCase()}</div>
        
        <div class="response">
            <strong>INSTANT REACTION:</strong><br>
            ${soul.responses.instant}
        </div>
        
        <div class="response">
            <strong>THE DEEPER TRUTH:</strong><br>
            ${soul.responses.deeper}
        </div>
        
        <div class="response">
            <strong>SHARED SUFFERING:</strong><br>
            ${soul.responses.shared}
        </div>
        
        <div class="response">
            <strong>POTENTIAL SOLUTION:</strong><br>
            ${soul.responses.solution}
        </div>
        
        <div class="response">
            <strong>YOU ARE NOT ALONE:</strong><br>
            ${soul.responses.others_suffering}<br>
            Debug signature: ${soul.responses.debug_signature}
        </div>
    `;
    
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({behavior: 'smooth'});
}

async function loadSharedPain() {
    const response = await fetch('/api/shared-pain');
    const pain = await response.json();
    
    const painDiv = document.getElementById('sharedPain');
    
    if (pain.length === 0) {
        painDiv.innerHTML = '<p class="error-log">Be the first to share your debugging nightmare...</p>';
        return;
    }
    
    painDiv.innerHTML = pain.map(soul => `
        <div class="pain-item" onclick='displayDebugSoul(${JSON.stringify(soul)})'>
            <strong>${soul.pain_type.replace(/_/g, ' ')}</strong><br>
            "${soul.text.substring(0, 100)}..."<br>
            <small>Relatability: ${soul.relatability}%</small>
        </div>
    `).join('');
}

// Load on start
loadSharedPain();
setInterval(loadSharedPain, 10000);

// Ctrl+Enter to submit
document.getElementById('debugInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        debugSoul();
    }
});
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path == '/api/shared-pain':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(dev_engine.shared_pain[:10]).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/debug':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                soul = dev_engine.analyze_dev_soul(data['text'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(soul).encode())
                
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[DEBUG] {format % args}")

httpd = socketserver.TCPServer(("", PORT), DevHandler)
httpd.allow_reuse_address = True

print(f"\nDEV SOUL ENGINE: http://localhost:{PORT}")
print("\nFor developers who've been in the trenches.")
print("\nThis understands:")
print("- 2-minute timeout hell")
print("- Formatting nightmares")
print("- Port chaos")
print("- CORS prison")
print("- Dependency hell")
print("- That feeling when nothing fucking works")
print("\nNo motivational bullshit. Just shared suffering.")

httpd.serve_forever()