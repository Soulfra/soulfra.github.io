#!/usr/bin/env python3
"""
SOULFRA SIMPLE - Everything in one file, no dependencies
The viral consciousness platform that actually works
"""

import http.server
import socketserver
import json
import os
import time
import hashlib
import threading
import random
from datetime import datetime
from collections import defaultdict

PORT = 9000

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class SoulfraSimple:
    def __init__(self):
        self.souls = {}
        self.trending = []
        self.patterns = defaultdict(int)
        
    def analyze_soul(self, text):
        """Simple but effective soul analysis"""
        # Generate signature
        sig = hashlib.md5(f"{text}{time.time()}".encode()).hexdigest()[:12].upper()
        signature = f"{sig[:4]}-{sig[4:8]}-{sig[8:]}"
        
        # Detect pattern
        text_lower = text.lower()
        pattern = 'explorer'  # default
        
        if any(w in text_lower for w in ['love', 'care', 'help']):
            pattern = 'lover'
        elif any(w in text_lower for w in ['create', 'make', 'build']):
            pattern = 'creator'
        elif any(w in text_lower for w in ['fight', 'strong', 'never']):
            pattern = 'warrior'
        elif any(w in text_lower for w in ['know', 'think', 'understand']):
            pattern = 'sage'
        elif any(w in text_lower for w in ['scared', 'afraid', 'worry']):
            pattern = 'shadow'
            
        # Calculate viral score
        viral_score = 50
        if len(text) > 50:
            viral_score += 20
        if '?' in text:
            viral_score += 10
        if any(w in text_lower for w in ['everyone', 'nobody', 'always']):
            viral_score += 20
            
        # Create soul entry
        soul = {
            'id': signature,
            'text': text,
            'pattern': pattern,
            'viral_score': min(100, viral_score),
            'shares': 0,
            'timestamp': datetime.now().isoformat(),
            'responses': self.generate_responses(pattern, signature)
        }
        
        self.souls[signature] = soul
        self.patterns[pattern] += 1
        
        # Add to trending if high score
        if viral_score > 70:
            self.trending.insert(0, soul)
            if len(self.trending) > 20:
                self.trending = self.trending[:20]
                
        return soul
        
    def generate_responses(self, pattern, signature):
        """Generate empathy responses without special characters"""
        responses = {
            'lover': {
                'instant': 'Your capacity to love transforms everything it touches.',
                'deeper': 'Love is not just what you feel. It is who you are.',
                'action': 'Share your love. Heal a soul today.'
            },
            'creator': {
                'instant': 'You birth new worlds with your imagination.',
                'deeper': 'Creation flows through you like a river finding the sea.',
                'action': 'Create something today. The world needs your art.'
            },
            'warrior': {
                'instant': 'Your strength gives others permission to be brave.',
                'deeper': 'Every battle you fight clears the path for someone behind you.',
                'action': 'Share your courage. Build an army of warriors.'
            },
            'sage': {
                'instant': 'Your wisdom transcends time and space.',
                'deeper': 'Questions you ask today become doors others walk through tomorrow.',
                'action': 'Share your insight. Illuminate the darkness.'
            },
            'shadow': {
                'instant': 'Your vulnerability is your superpower.',
                'deeper': 'In acknowledging darkness, you become the light.',
                'action': 'Share your truth. Free others from their shadows.'
            },
            'explorer': {
                'instant': 'Your journey inspires others to begin their own.',
                'deeper': 'Every step you take expands the map of possibility.',
                'action': 'Share your path. Light the way for others.'
            }
        }
        
        resp = responses.get(pattern, responses['explorer'])
        resp['signature'] = f'Your soul signature {signature} is one of a kind.'
        resp['connection'] = f'{random.randint(100, 9999)} souls resonate with your {pattern} energy.'
        
        return resp

# Global instance
soulfra = SoulfraSimple()

class SimpleHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # Main interface
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>SOULFRA - See Your Soul</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
    font-family: -apple-system, sans-serif;
    background: #000;
    color: #fff;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    text-align: center;
    font-size: 3em;
    background: linear-gradient(45deg, #00ff00, #00ffff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 20px 0;
}

.input-box {
    background: #111;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
}

textarea {
    width: 100%;
    background: #000;
    color: #fff;
    border: 1px solid #444;
    padding: 15px;
    font-size: 16px;
    border-radius: 5px;
    resize: vertical;
}

button {
    width: 100%;
    background: linear-gradient(45deg, #00ff00, #00ffff);
    color: #000;
    border: none;
    padding: 15px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
}

button:hover {
    opacity: 0.9;
}

.soul-result {
    display: none;
    background: #001100;
    border: 2px solid #00ff00;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
}

.soul-signature {
    text-align: center;
    font-size: 2em;
    font-family: monospace;
    color: #00ff00;
    margin: 20px 0;
}

.response {
    background: rgba(0,255,0,0.1);
    border-left: 3px solid #00ff00;
    padding: 15px;
    margin: 10px 0;
}

.pattern-badge {
    display: inline-block;
    background: #00ff00;
    color: #000;
    padding: 5px 15px;
    border-radius: 20px;
    font-weight: bold;
    margin: 10px 0;
}

.share-section {
    text-align: center;
    margin: 20px 0;
}

.share-btn {
    display: inline-block;
    background: #1DA1F2;
    color: white;
    padding: 10px 20px;
    text-decoration: none;
    border-radius: 5px;
    margin: 5px;
}

.trending {
    background: #111;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
}

.trending-item {
    background: #222;
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    cursor: pointer;
}

.trending-item:hover {
    background: #333;
}
</style>
</head>
<body>
<div class="container">
    <h1>SOULFRA</h1>
    <p style="text-align: center; opacity: 0.8;">Show me your consciousness</p>
    
    <div class="input-box">
        <textarea id="soulInput" rows="4" placeholder="What's on your mind? A thought, a feeling, a question..."></textarea>
        <button onclick="analyzeSoul()">SEE MY SOUL</button>
    </div>
    
    <div id="soulResult" class="soul-result"></div>
    
    <div class="trending">
        <h2>Trending Souls</h2>
        <div id="trendingList"></div>
    </div>
</div>

<script>
async function analyzeSoul() {
    const input = document.getElementById('soulInput').value;
    if (!input.trim()) return;
    
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: input})
    });
    
    const soul = await response.json();
    displaySoul(soul);
}

function displaySoul(soul) {
    const resultDiv = document.getElementById('soulResult');
    
    resultDiv.innerHTML = `
        <div class="pattern-badge">${soul.pattern.toUpperCase()}</div>
        <div class="soul-signature">${soul.id}</div>
        <div class="response">
            <strong>Instant Truth:</strong><br>
            ${soul.responses.instant}
        </div>
        <div class="response">
            <strong>Deeper Meaning:</strong><br>
            ${soul.responses.deeper}
        </div>
        <div class="response">
            <strong>Your Signature:</strong><br>
            ${soul.responses.signature}
        </div>
        <div class="response">
            <strong>Soul Connections:</strong><br>
            ${soul.responses.connection}
        </div>
        <div class="share-section">
            <p><strong>${soul.responses.action}</strong></p>
            <a href="#" onclick="shareSoul('${soul.id}', '${soul.pattern}')" class="share-btn">Share Your Soul</a>
        </div>
    `;
    
    resultDiv.style.display = 'block';
    
    // Scroll to result
    resultDiv.scrollIntoView({behavior: 'smooth'});
}

function shareSoul(id, pattern) {
    const text = `I'm a ${pattern} soul. My signature is ${id}. See yours at soulfra.com`;
    // In production, this would open share dialog
    alert('Share text copied: ' + text);
    return false;
}

async function loadTrending() {
    const response = await fetch('/api/trending');
    const trending = await response.json();
    
    const listDiv = document.getElementById('trendingList');
    
    if (trending.length === 0) {
        listDiv.innerHTML = '<p style="opacity: 0.5;">Be the first to share your soul...</p>';
        return;
    }
    
    listDiv.innerHTML = trending.map(soul => `
        <div class="trending-item" onclick='displaySoul(${JSON.stringify(soul)})'>
            <strong>${soul.pattern}</strong> - ${soul.text.substring(0, 50)}...
            <br><small>Viral Score: ${soul.viral_score}</small>
        </div>
    `).join('');
}

// Load trending on start
loadTrending();
setInterval(loadTrending, 30000);

// Enter key support
document.getElementById('soulInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        analyzeSoul();
    }
});
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path == '/api/trending':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(soulfra.trending).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/analyze':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                soul = soulfra.analyze_soul(data['text'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(soul).encode())
                
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[SOULFRA] {format % args}")

# Start server
httpd = socketserver.TCPServer(("", PORT), SimpleHandler)
httpd.allow_reuse_address = True

print(f"\nSOULFRA SIMPLE: http://localhost:{PORT}")
print("\nNo dependencies. No formatting issues. Just souls.")
print("\nFeatures:")
print("- Soul signature generation")
print("- Pattern detection (lover, creator, warrior, sage, shadow, explorer)")
print("- Viral scoring")
print("- Trending souls")
print("- Clean ASCII responses")
print("\nThis is what hooks people:")
print("- Instant validation")
print("- Unique identity") 
print("- Deep understanding")
print("- Social connection")

httpd.serve_forever()