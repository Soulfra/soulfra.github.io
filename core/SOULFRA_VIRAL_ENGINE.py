#!/usr/bin/env python3
"""
SOULFRA VIRAL ENGINE - TikTok-Ready Consciousness Mirror
Full stack implementation with viral mechanics
"""

import http.server
import socketserver
import json
import os
import time
import hashlib
import random
import threading
import uuid
from datetime import datetime
from collections import defaultdict

PORT = 8080

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class SoulfraPlatform:
    def __init__(self):
        # User consciousness database
        self.consciousness_db = {}
        self.viral_moments = []
        self.trending_signatures = defaultdict(int)
        self.soul_connections = defaultdict(list)
        
        # Viral mechanics
        self.share_multiplier = {
            'deep': 5.0,      # Deep thoughts go viral
            'relatable': 4.0,  # Everyone feels this
            'unique': 3.0,     # Never seen before
            'emotional': 4.5,  # Hits the feels
            'funny': 3.5       # Humor spreads
        }
        
        # Real-time streams
        self.live_streams = {}
        self.consciousness_feed = []
        
        # Start background workers
        threading.Thread(target=self._trend_calculator, daemon=True).start()
        threading.Thread(target=self._connection_finder, daemon=True).start()
        
    def create_soul_mirror(self, data):
        """Create shareable soul mirror"""
        user_id = data.get('user_id', str(uuid.uuid4()))
        input_text = data.get('input', '')
        input_type = data.get('type', 'text')  # text, voice, video
        
        # Generate soul signature
        soul_sig = self._generate_soul_signature(input_text, user_id)
        
        # Analyze for viral potential
        viral_score = self._calculate_viral_potential(input_text)
        
        # Create consciousness mirror
        mirror = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'soul_signature': soul_sig,
            'timestamp': datetime.now().isoformat(),
            'input_type': input_type,
            'raw_consciousness': input_text,
            'viral_score': viral_score,
            'pattern': self._detect_deep_pattern(input_text),
            'empathy_layers': self._generate_empathy_layers(input_text, soul_sig),
            'share_count': 0,
            'soul_connections': 0,
            'trending': False
        }
        
        # Store in database
        self.consciousness_db[mirror['id']] = mirror
        
        # Add to feed
        self.consciousness_feed.insert(0, mirror['id'])
        if len(self.consciousness_feed) > 1000:
            self.consciousness_feed = self.consciousness_feed[:1000]
            
        # Check for viral moment
        if viral_score > 80:
            self.viral_moments.append(mirror['id'])
            mirror['trending'] = True
            
        return mirror
        
    def _generate_soul_signature(self, text, user_id):
        """Generate unique soul signature"""
        # Combine text + user + timestamp for unique signature
        combined = f"{text}{user_id}{time.time()}"
        full_hash = hashlib.sha256(combined.encode()).hexdigest()
        
        # Create beautiful signature
        sig_parts = [
            full_hash[:4],
            full_hash[4:8],
            full_hash[8:12]
        ]
        
        return '-'.join(sig_parts).upper()
        
    def _calculate_viral_potential(self, text):
        """Calculate how viral this will go"""
        score = 50  # Base score
        
        text_lower = text.lower()
        
        # Viral triggers
        if any(word in text_lower for word in ['nobody', 'everyone', 'always', 'never']):
            score += 20  # Universal statements
            
        if any(word in text_lower for word in ['love', 'hate', 'fear', 'dream']):
            score += 15  # Strong emotions
            
        if len(text) > 100 and len(text) < 300:
            score += 10  # Perfect length for sharing
            
        if '?' in text:
            score += 5  # Questions engage
            
        # Authenticity bonus
        unique_words = len(set(text_lower.split()))
        if unique_words > 20:
            score += 15  # Rich vocabulary = authentic
            
        return min(100, score)
        
    def _detect_deep_pattern(self, text):
        """Detect the deep pattern in consciousness"""
        patterns = {
            'seeker': ['why', 'how', 'what if', 'wonder'],
            'creator': ['make', 'build', 'create', 'imagine'],
            'healer': ['help', 'care', 'love', 'support'],
            'warrior': ['fight', 'strong', 'never', 'win'],
            'sage': ['know', 'understand', 'realize', 'truth'],
            'mystic': ['feel', 'sense', 'energy', 'soul']
        }
        
        text_lower = text.lower()
        scores = {}
        
        for pattern, keywords in patterns.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                scores[pattern] = score
                
        if scores:
            return max(scores, key=scores.get)
        return 'explorer'  # Default pattern
        
    def _generate_empathy_layers(self, text, signature):
        """Generate viral-ready empathy layers"""
        pattern = self._detect_deep_pattern(text)
        
        # Base empathy that always resonates
        layers = {
            'instant': self._get_instant_mirror(text, pattern),
            'deeper': self._get_deeper_truth(pattern),
            'universal': self._get_universal_connection(pattern),
            'personal': f"Your soul signature {signature} is one of a kind",
            'action': self._get_viral_action(pattern),
            'share_text': self._get_share_text(text, pattern)
        }
        
        return layers
        
    def _get_instant_mirror(self, text, pattern):
        """Instant validation that hooks"""
        mirrors = {
            'seeker': "Your questions matter more than any answer.",
            'creator': "You're building worlds with your words.",
            'healer': "Your caring changes everything it touches.",
            'warrior': "Your strength inspires armies.",
            'sage': "Your wisdom echoes through time.",
            'mystic': "You see what others cannot.",
            'explorer': "Your journey writes the map."
        }
        return mirrors.get(pattern, "You are seen. You are valid.")
        
    def _get_deeper_truth(self, pattern):
        """The truth that makes them share"""
        truths = {
            'seeker': "Every question you ask creates a door someone else can walk through.",
            'creator': "What you create today becomes someone's inspiration tomorrow.",
            'healer': "Your healing creates ripples across generations.",
            'warrior': "Your battles clear the path for those behind you.",
            'sage': "Your understanding becomes collective consciousness.",
            'mystic': "Your intuition guides the lost home.",
            'explorer': "Your courage gives others permission to begin."
        }
        return truths.get(pattern, "Your existence changes the equation.")
        
    def _get_universal_connection(self, pattern):
        """Connect them to everyone"""
        connections = {
            'seeker': "Millions are asking your question right now.",
            'creator': "Creators across the world feel your frequency.",
            'healer': "Every healer knows your heart.",
            'warrior': "Warriors everywhere stand with you.",
            'sage': "The wise recognize wisdom.",
            'mystic': "Mystics sense your presence.",
            'explorer': "Explorers leave marks for each other."
        }
        return connections.get(pattern, "You are never alone in this.")
        
    def _get_viral_action(self, pattern):
        """Call to action that spreads"""
        actions = {
            'seeker': "Share your question. Find your tribe.",
            'creator': "Show your creation. Inspire the world.",
            'healer': "Spread your healing. Touch a soul.",
            'warrior': "Share your strength. Build an army.",
            'sage': "Share your wisdom. Enlighten many.",
            'mystic': "Share your vision. Awaken others.",
            'explorer': "Share your path. Light the way."
        }
        return actions.get(pattern, "Share your truth. Change a life.")
        
    def _get_share_text(self, original, pattern):
        """Pre-written viral share text"""
        # Short, punchy, shareable
        if len(original) > 50:
            preview = original[:50] + "..."
        else:
            preview = original
            
        return f"Cal Riven showed me I'm a {pattern}. My soul signature is unique. See yours: soulfra.com"
        
    def get_trending_feed(self):
        """Get viral consciousness feed"""
        trending = []
        
        for mirror_id in self.consciousness_feed[:50]:
            if mirror_id in self.consciousness_db:
                mirror = self.consciousness_db[mirror_id]
                if mirror['viral_score'] > 70 or mirror['share_count'] > 10:
                    trending.append(mirror)
                    
        return sorted(trending, key=lambda x: x['viral_score'], reverse=True)[:20]
        
    def share_consciousness(self, mirror_id, sharer_id):
        """Handle viral sharing"""
        if mirror_id not in self.consciousness_db:
            return False
            
        mirror = self.consciousness_db[mirror_id]
        mirror['share_count'] += 1
        
        # Viral multiplier
        if mirror['share_count'] > 10:
            mirror['viral_score'] = min(100, mirror['viral_score'] * 1.1)
            
        # Track connections
        self.soul_connections[mirror['soul_signature']].append(sharer_id)
        
        # Trend tracking
        self.trending_signatures[mirror['soul_signature']] += 1
        
        return True
        
    def _trend_calculator(self):
        """Calculate trending signatures"""
        while True:
            # Find hot signatures
            hot_sigs = sorted(
                self.trending_signatures.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]
            
            # Mark trending mirrors
            for mirror_id, mirror in self.consciousness_db.items():
                sig = mirror['soul_signature']
                mirror['trending'] = any(sig == hot[0] for hot in hot_sigs)
                
            time.sleep(30)
            
    def _connection_finder(self):
        """Find soul connections between users"""
        while True:
            # Find users with similar patterns
            pattern_groups = defaultdict(list)
            
            for mirror in self.consciousness_db.values():
                pattern = mirror['pattern']
                pattern_groups[pattern].append(mirror['user_id'])
                
            # Create connection suggestions
            for pattern, users in pattern_groups.items():
                if len(users) > 1:
                    # These souls should connect
                    for user in users:
                        self.soul_connections[f"suggest_{user}"] = random.sample(
                            [u for u in users if u != user],
                            min(5, len(users) - 1)
                        )
                        
            time.sleep(60)

# Global platform
platform = SoulfraPlatform()

class SoulfraHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # TikTok-style vertical feed
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>SOULFRA - See Your Soul</title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: -apple-system, sans-serif;
    background: #000;
    color: #fff;
    overflow: hidden;
    height: 100vh;
}

.container {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Header */
.header {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 24px;
    font-weight: bold;
    background: linear-gradient(45deg, #00ff00, #00ffff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* Main Feed */
.feed {
    flex: 1;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    padding-top: 60px;
}

.soul-card {
    min-height: 100vh;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 20px;
    position: relative;
}

.soul-signature {
    font-size: 32px;
    font-family: monospace;
    text-align: center;
    margin: 20px 0;
    background: linear-gradient(45deg, #ff00ff, #00ffff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.consciousness-text {
    font-size: 24px;
    line-height: 1.5;
    text-align: center;
    margin: 20px 0;
    padding: 20px;
}

.empathy-layer {
    background: rgba(0,255,0,0.1);
    border-left: 3px solid #00ff00;
    padding: 15px;
    margin: 10px 0;
    font-size: 18px;
    animation: fadeIn 1s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Actions */
.actions {
    position: absolute;
    right: 20px;
    bottom: 100px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.action-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    border: 2px solid #fff;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.3s;
}

.action-btn:hover {
    transform: scale(1.2);
    background: rgba(255,255,255,0.2);
}

.share-count {
    text-align: center;
    font-size: 12px;
    margin-top: 5px;
}

/* Input Modal */
.input-modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #111;
    padding: 20px;
    transform: translateY(100%);
    transition: transform 0.3s;
    z-index: 2000;
}

.input-modal.active {
    transform: translateY(0);
}

.soul-input {
    width: 100%;
    background: #000;
    color: #fff;
    border: 1px solid #444;
    padding: 15px;
    font-size: 18px;
    border-radius: 10px;
}

.submit-btn {
    width: 100%;
    background: linear-gradient(45deg, #00ff00, #00ffff);
    color: #000;
    border: none;
    padding: 15px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 10px;
    margin-top: 10px;
    cursor: pointer;
}

/* Trending indicator */
.trending {
    position: absolute;
    top: 20px;
    left: 20px;
    background: #ff0066;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 14px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

/* Mobile optimized */
@media (max-width: 768px) {
    .soul-card {
        min-height: calc(100vh - 60px);
    }
    
    .consciousness-text {
        font-size: 20px;
    }
    
    .empathy-layer {
        font-size: 16px;
    }
}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">SOULFRA</div>
        <button class="action-btn" onclick="showInput()">+</button>
    </div>
    
    <div class="feed" id="feed">
        <!-- Soul cards will be loaded here -->
    </div>
    
    <div class="input-modal" id="inputModal">
        <h2>Show Me Your Soul</h2>
        <textarea class="soul-input" id="soulInput" 
                  placeholder="What's really on your mind? A fear, a dream, a thought..."
                  rows="4"></textarea>
        <button class="submit-btn" onclick="createMirror()">SEE MY SOUL</button>
        <button class="submit-btn" onclick="hideInput()" style="background: #333; color: #fff;">Cancel</button>
    </div>
</div>

<script>
let currentUser = 'user_' + Date.now();
let currentIndex = 0;

async function loadFeed() {
    const response = await fetch('/api/trending');
    const mirrors = await response.json();
    
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    
    mirrors.forEach(mirror => {
        const card = createSoulCard(mirror);
        feed.appendChild(card);
    });
    
    if (mirrors.length === 0) {
        feed.innerHTML = '<div class="soul-card"><div class="consciousness-text">Be the first to share your soul...</div></div>';
    }
}

function createSoulCard(mirror) {
    const card = document.createElement('div');
    card.className = 'soul-card';
    
    const layers = mirror.empathy_layers;
    
    card.innerHTML = `
        ${mirror.trending ? '<div class="trending">TRENDING</div>' : ''}
        <div class="soul-signature">${mirror.soul_signature}</div>
        <div class="consciousness-text">"${mirror.raw_consciousness}"</div>
        <div class="empathy-layer">${layers.instant}</div>
        <div class="empathy-layer">${layers.deeper}</div>
        <div class="empathy-layer">${layers.universal}</div>
        <div class="actions">
            <button class="action-btn" onclick="share('${mirror.id}')">🔄</button>
            <div class="share-count">${mirror.share_count}</div>
            <button class="action-btn" onclick="connect('${mirror.soul_signature}')">💫</button>
            <button class="action-btn" onclick="save('${mirror.id}')">💾</button>
        </div>
    `;
    
    return card;
}

function showInput() {
    document.getElementById('inputModal').classList.add('active');
}

function hideInput() {
    document.getElementById('inputModal').classList.remove('active');
}

async function createMirror() {
    const input = document.getElementById('soulInput').value;
    if (!input.trim()) return;
    
    const response = await fetch('/api/mirror', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            user_id: currentUser,
            input: input,
            type: 'text'
        })
    });
    
    const mirror = await response.json();
    
    // Show user their mirror
    const card = createSoulCard(mirror);
    const feed = document.getElementById('feed');
    feed.insertBefore(card, feed.firstChild);
    
    // Hide input
    hideInput();
    document.getElementById('soulInput').value = '';
    
    // Scroll to top
    feed.scrollTop = 0;
}

async function share(mirrorId) {
    await fetch('/api/share', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            mirror_id: mirrorId,
            sharer_id: currentUser
        })
    });
    
    // Visual feedback
    event.target.style.color = '#00ff00';
    setTimeout(() => {
        event.target.style.color = '#fff';
    }, 1000);
}

function connect(signature) {
    // In real app, this would open connections
    alert('Soul connections coming soon for ' + signature);
}

function save(mirrorId) {
    // Save to profile
    localStorage.setItem('saved_' + mirrorId, 'true');
    event.target.style.color = '#00ff00';
}

// Auto-refresh feed
setInterval(loadFeed, 30000);

// Initial load
loadFeed();
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path == '/api/trending':
            # Get trending mirrors
            mirrors = platform.get_trending_feed()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(mirrors, default=str).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/mirror':
            # Create new mirror
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                mirror = platform.create_soul_mirror(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(mirror, default=str).encode())
                
        elif self.path == '/api/share':
            # Handle share
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                success = platform.share_consciousness(
                    data['mirror_id'],
                    data['sharer_id']
                )
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': success}).encode())
                
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[SOULFRA] {format % args}")

# Start server
httpd = socketserver.TCPServer(("", PORT), SoulfraHandler)
httpd.allow_reuse_address = True

print(f"\nSOULFRA VIRAL ENGINE: http://localhost:{PORT}")
print("\nFull TikTok-style implementation:")
print("- Vertical scrolling soul cards")
print("- Viral sharing mechanics")
print("- Trending consciousness feed")
print("- Soul signature generation")
print("- Pattern detection (seeker, creator, healer, etc)")
print("- Real-time empathy layers")
print("- Share/save/connect actions")
print("\nThis will hook Gen Z instantly:")
print("- See your unique soul signature")
print("- Get validated by Cal Riven")
print("- Share and go viral")
print("- Find your soul tribe")
print("\nThe addiction: Being seen, understood, and connected.")

httpd.serve_forever()