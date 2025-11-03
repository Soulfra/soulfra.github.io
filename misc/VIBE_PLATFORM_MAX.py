#!/usr/bin/env python3
"""
VIBE PLATFORM MAX - The Ultimate Dev/Support/Learning Ecosystem
With Cal & Arty's Live Vibecast, Private Debug Rooms, and Chat Log Learning
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
import sqlite3

PORT = 8888

os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class VibePlatformMax:
    def __init__(self):
        self.init_database()
        
        # Platform state
        self.active_rooms = {}
        self.vibecast_live = False
        self.chat_log_db = []
        self.ai_personalities = {
            'cal': {
                'style': 'empathetic philosopher',
                'catchphrases': [
                    "I see your soul struggling with this code",
                    "Your frustration is valid, let's transform it",
                    "This bug is teaching you something deeper"
                ]
            },
            'arty': {
                'style': 'chaotic genius',
                'catchphrases': [
                    "YOOO this error is actually hilarious",
                    "Bro why is JavaScript like this though",
                    "Let's break it more to understand it"
                ]
            }
        }
        
        # Live vibecast state
        self.vibecast = {
            'active': False,
            'hosts': ['cal', 'arty'],
            'current_topic': None,
            'viewers': 0,
            'chat': [],
            'featured_dev': None,
            'replay_buffer': []
        }
        
        # Room types
        self.room_types = {
            'debug_therapy': {
                'name': 'Debug Therapy Sessions',
                'description': 'Private 1-on-1 debugging with empathy',
                'max_participants': 2,
                'ai_moderator': 'cal'
            },
            'chaos_coding': {
                'name': 'Chaos Coding Arena', 
                'description': 'Public room where we break things to learn',
                'max_participants': 50,
                'ai_moderator': 'arty'
            },
            'soul_support': {
                'name': 'Soul Support Circle',
                'description': 'Group therapy for production disasters',
                'max_participants': 10,
                'ai_moderator': 'cal'
            },
            'vibe_check': {
                'name': 'Vibe Check Lounge',
                'description': 'Chill space to share wins and losses',
                'max_participants': 100,
                'ai_moderator': 'both'
            }
        }
        
        # Chat log learning system
        self.learning_patterns = defaultdict(list)
        self.solution_database = defaultdict(list)
        self.vibe_metrics = {
            'total_vibes': 0,
            'problems_solved': 0,
            'empathy_moments': 0,
            'chaos_embraced': 0
        }
        
        # Start background threads
        threading.Thread(target=self._vibecast_engine, daemon=True).start()
        threading.Thread(target=self._ai_learning_loop, daemon=True).start()
        
    def init_database(self):
        """Initialize SQLite for persistence"""
        self.conn = sqlite3.connect('vibeplatform.db', check_same_thread=False)
        c = self.conn.cursor()
        
        c.execute('''CREATE TABLE IF NOT EXISTS chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            message TEXT,
            emotion TEXT,
            timestamp TIMESTAMP,
            room_id TEXT,
            ai_response TEXT
        )''')
        
        c.execute('''CREATE TABLE IF NOT EXISTS vibecast_archives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            hosts TEXT,
            transcript TEXT,
            highlights TEXT,
            viewer_count INTEGER,
            timestamp TIMESTAMP
        )''')
        
        c.execute('''CREATE TABLE IF NOT EXISTS room_sessions (
            id TEXT PRIMARY KEY,
            room_type TEXT,
            participants TEXT,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            vibe_score INTEGER,
            problems_solved INTEGER
        )''')
        
        self.conn.commit()
        
    def upload_chat_logs(self, data):
        """Process uploaded chat logs for AI training"""
        logs = data.get('logs', [])
        user_id = data.get('user_id', 'anonymous')
        
        processed = 0
        insights_gained = []
        
        for log_entry in logs:
            # Extract patterns
            if isinstance(log_entry, dict):
                message = log_entry.get('message', '')
                emotion = self._detect_emotion(message)
                
                # Store in database
                c = self.conn.cursor()
                c.execute('''INSERT INTO chat_logs 
                            (user_id, message, emotion, timestamp, room_id, ai_response)
                            VALUES (?, ?, ?, ?, ?, ?)''',
                         (user_id, message, emotion, datetime.now(), 
                          'upload', 'pending'))
                
                # Learn from patterns
                if 'error' in message.lower() or 'bug' in message.lower():
                    pattern = self._extract_error_pattern(message)
                    self.learning_patterns['errors'].append(pattern)
                    
                    # Look for solutions in follow-up messages
                    if 'fixed' in message.lower() or 'solved' in message.lower():
                        self.solution_database[pattern].append(message)
                        insights_gained.append(f"Learned solution for: {pattern[:50]}...")
                        
                processed += 1
                
        self.conn.commit()
        
        # Update AI knowledge
        self._update_ai_knowledge()
        
        return {
            'processed': processed,
            'insights_gained': insights_gained[:5],
            'total_patterns': len(self.learning_patterns),
            'vibe_boost': processed * 10
        }
        
    def create_room(self, room_data):
        """Create a private or public room"""
        room_type = room_data.get('type', 'vibe_check')
        room_config = self.room_types.get(room_type, self.room_types['vibe_check'])
        
        room_id = hashlib.md5(f"{room_type}{time.time()}".encode()).hexdigest()[:8]
        
        room = {
            'id': room_id,
            'type': room_type,
            'name': room_data.get('name', f"{room_config['name']} #{room_id}"),
            'config': room_config,
            'participants': [],
            'messages': [],
            'ai_moderator': room_config['ai_moderator'],
            'created': datetime.now().isoformat(),
            'vibe_score': 50,
            'private': room_data.get('private', False),
            'password': room_data.get('password', None) if room_data.get('private') else None
        }
        
        self.active_rooms[room_id] = room
        
        # Start room session in DB
        c = self.conn.cursor()
        c.execute('''INSERT INTO room_sessions 
                    (id, room_type, participants, start_time, vibe_score, problems_solved)
                    VALUES (?, ?, ?, ?, ?, ?)''',
                 (room_id, room_type, '[]', datetime.now(), 50, 0))
        self.conn.commit()
        
        return room
        
    def start_vibecast(self, topic=None):
        """Start Cal & Arty's live vibecast"""
        if self.vibecast['active']:
            return {'error': 'Vibecast already live!'}
            
        self.vibecast['active'] = True
        self.vibecast['current_topic'] = topic or self._generate_vibecast_topic()
        self.vibecast['viewers'] = 0
        self.vibecast['chat'] = []
        self.vibecast['replay_buffer'] = []
        
        # Initial vibecast intro
        intro = self._generate_vibecast_intro()
        self.vibecast['replay_buffer'].append(intro)
        
        return {
            'status': 'live',
            'topic': self.vibecast['current_topic'],
            'intro': intro,
            'stream_url': f"http://localhost:{PORT}/vibecast/live"
        }
        
    def _vibecast_engine(self):
        """Background thread for vibecast generation"""
        while True:
            if self.vibecast['active']:
                # Generate conversation between Cal and Arty
                segment = self._generate_vibecast_segment()
                self.vibecast['replay_buffer'].append(segment)
                
                # Keep buffer reasonable size
                if len(self.vibecast['replay_buffer']) > 100:
                    self.vibecast['replay_buffer'] = self.vibecast['replay_buffer'][-100:]
                    
                # Check for featured dev
                if self.vibecast['featured_dev']:
                    self._generate_dev_interview()
                    
            time.sleep(10)  # New segment every 10 seconds
            
    def _generate_vibecast_intro(self):
        """Generate vibecast intro"""
        topic = self.vibecast['current_topic']
        
        intros = {
            'debugging': {
                'cal': "Welcome souls, to another journey through the debugging dimension. Today we explore the sacred art of error messages.",
                'arty': "YO WHAT'S GOOD DEBUG FAM! Today we're gonna break EVERYTHING and see what happens!"
            },
            'empathy': {
                'cal': "Greetings, consciousness explorers. Today we dive deep into the empathy protocols of support.",
                'arty': "Alright chat, today we're learning how to not be robots when helping people. Let's GO!"
            },
            'chaos': {
                'cal': "Welcome to the chaos realm, where disorder becomes wisdom.",
                'arty': "CHAOS GANG RISE UP! Today we're embracing the madness of production deployments!"
            }
        }
        
        category = 'debugging'  # Default
        for key in intros:
            if key in topic.lower():
                category = key
                break
                
        return {
            'timestamp': datetime.now().isoformat(),
            'cal': intros[category]['cal'],
            'arty': intros[category]['arty'],
            'type': 'intro'
        }
        
    def _generate_vibecast_segment(self):
        """Generate a conversation segment"""
        # Pick random recent issue from chat logs
        c = self.conn.cursor()
        c.execute('''SELECT message, emotion FROM chat_logs 
                    ORDER BY timestamp DESC LIMIT 10''')
        recent_issues = c.fetchall()
        
        if recent_issues:
            issue, emotion = random.choice(recent_issues)
            
            # Cal's empathetic take
            cal_response = self._generate_cal_response(issue, emotion)
            
            # Arty's chaotic take
            arty_response = self._generate_arty_response(issue, emotion)
            
            return {
                'timestamp': datetime.now().isoformat(),
                'discussing': issue[:100] + '...',
                'cal': cal_response,
                'arty': arty_response,
                'type': 'discussion'
            }
        else:
            # Generic banter
            return {
                'timestamp': datetime.now().isoformat(),
                'cal': "The void of no errors is itself a teacher.",
                'arty': "Bro there's literally nothing breaking right now, this is sus.",
                'type': 'banter'
            }
            
    def _generate_cal_response(self, issue, emotion):
        """Cal's empathetic philosophical response"""
        if emotion == 'frustrated':
            return f"I feel the weight of this frustration. {random.choice(self.ai_personalities['cal']['catchphrases'])} The path through this {issue[:30]}... requires patience with ourselves."
        elif emotion == 'confused':
            return f"Confusion is the doorway to understanding. This {issue[:30]}... is asking you to see it differently."
        else:
            return f"Interesting. {random.choice(self.ai_personalities['cal']['catchphrases'])} There's wisdom hidden in this challenge."
            
    def _generate_arty_response(self, issue, emotion):
        """Arty's chaotic genius response"""
        if 'error' in issue.lower():
            return f"YOOO this error though! {random.choice(self.ai_personalities['arty']['catchphrases'])} Let's console.log EVERYTHING and see what explodes!"
        elif 'timeout' in issue.lower():
            return "Timeout errors are just the universe telling you to take a break! Or add more async/await everywhere!"
        else:
            return f"{random.choice(self.ai_personalities['arty']['catchphrases'])} This is why we can't have nice things in JavaScript!"
            
    def _generate_vibecast_topic(self):
        """Generate random vibecast topic"""
        topics = [
            "Debugging Your Soul: When Code Reflects Life",
            "The Empathy Protocol: Supporting Humans in Tech",
            "Chaos Theory: Why Everything Breaks in Production",
            "Timeout Trauma: Healing from Async Wounds",
            "The Port 6666 Mystery: Cursed Infrastructure",
            "Formatting Hell: A Journey Through UTF-8 Nightmares"
        ]
        
        return random.choice(topics)
        
    def _detect_emotion(self, text):
        """Detect emotion in text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['fuck', 'shit', 'damn', 'hate']):
            return 'frustrated'
        elif any(word in text_lower for word in ['help', 'please', 'stuck', 'confused']):
            return 'confused'
        elif any(word in text_lower for word in ['finally', 'works', 'fixed', 'yes']):
            return 'relieved'
        elif any(word in text_lower for word in ['thanks', 'appreciate', 'awesome']):
            return 'grateful'
        else:
            return 'neutral'
            
    def _extract_error_pattern(self, text):
        """Extract error pattern for learning"""
        # Simple pattern extraction - in production this would be more sophisticated
        if 'timeout' in text.lower():
            return 'timeout_pattern'
        elif 'undefined' in text.lower():
            return 'undefined_pattern'
        elif 'port' in text.lower():
            return 'port_pattern'
        else:
            return 'general_error_pattern'
            
    def _update_ai_knowledge(self):
        """Update AI knowledge from patterns"""
        # This would trigger retraining in production
        self.vibe_metrics['total_vibes'] += 1
        
    def _ai_learning_loop(self):
        """Background AI learning"""
        while True:
            # Process patterns and update knowledge
            if len(self.learning_patterns) > 100:
                # Consolidate learning
                self.vibe_metrics['problems_solved'] += 1
                
            time.sleep(60)  # Learn every minute

# Global platform
platform = VibePlatformMax()

class VibePlatformHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # Main platform interface
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>VIBE PLATFORM MAX - Ultimate Dev Ecosystem</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
    font-family: -apple-system, sans-serif;
    background: #0a0a0a;
    color: #fff;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    text-align: center;
    font-size: 4em;
    background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 20px 0;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 40px 0;
}

.card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 20px;
    transition: all 0.3s;
}

.card:hover {
    background: rgba(255,255,255,0.1);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,255,255,0.3);
}

.vibecast {
    background: linear-gradient(135deg, #ff00ff, #00ffff);
    color: #000;
    padding: 30px;
    border-radius: 20px;
    margin: 20px 0;
    text-align: center;
}

.vibecast.live {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 0.8; }
    50% { opacity: 1; }
    100% { opacity: 0.8; }
}

.room {
    background: rgba(0,255,0,0.1);
    border: 1px solid #00ff00;
    padding: 15px;
    margin: 10px 0;
    border-radius: 10px;
    cursor: pointer;
}

.room:hover {
    background: rgba(0,255,0,0.2);
}

button {
    background: linear-gradient(45deg, #ff00ff, #00ffff);
    color: #000;
    border: none;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s;
    margin: 10px;
}

button:hover {
    transform: scale(1.1);
    box-shadow: 0 5px 20px rgba(255,0,255,0.5);
}

.chat-upload {
    background: rgba(255,255,0,0.1);
    border: 2px dashed #ffff00;
    padding: 30px;
    text-align: center;
    border-radius: 15px;
    margin: 20px 0;
}

.metrics {
    display: flex;
    justify-content: space-around;
    margin: 30px 0;
}

.metric {
    text-align: center;
}

.metric-value {
    font-size: 3em;
    color: #00ffff;
}

.metric-label {
    opacity: 0.7;
}

.live-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    background: #ff0000;
    border-radius: 50%;
    animation: blink 1s infinite;
    margin-right: 10px;
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

.vibecast-chat {
    background: rgba(0,0,0,0.5);
    height: 300px;
    overflow-y: auto;
    padding: 15px;
    border-radius: 10px;
    margin: 20px 0;
    font-family: monospace;
}

.cal-message {
    color: #00ff00;
    margin: 10px 0;
}

.arty-message {
    color: #ff00ff;
    margin: 10px 0;
}

textarea {
    width: 100%;
    background: rgba(0,0,0,0.5);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 15px;
    border-radius: 10px;
    font-size: 16px;
}
</style>
</head>
<body>
<div class="container">
    <h1>VIBE PLATFORM MAX</h1>
    <p style="text-align: center; font-size: 1.2em; opacity: 0.8;">
        Where debugging meets enlightenment, chaos meets empathy
    </p>
    
    <div class="metrics">
        <div class="metric">
            <div class="metric-value" id="totalVibes">0</div>
            <div class="metric-label">Total Vibes</div>
        </div>
        <div class="metric">
            <div class="metric-value" id="problemsSolved">0</div>
            <div class="metric-label">Problems Solved</div>
        </div>
        <div class="metric">
            <div class="metric-value" id="activeRooms">0</div>
            <div class="metric-label">Active Rooms</div>
        </div>
        <div class="metric">
            <div class="metric-value" id="liveViewers">0</div>
            <div class="metric-label">Vibecast Viewers</div>
        </div>
    </div>
    
    <div class="vibecast" id="vibecastSection">
        <h2><span class="live-indicator"></span>CAL & ARTY'S VIBECAST</h2>
        <div id="vibecastStatus">
            <button onclick="startVibecast()">START LIVE VIBECAST</button>
        </div>
        <div id="vibecastContent" style="display:none;">
            <h3 id="vibecastTopic"></h3>
            <div class="vibecast-chat" id="vibecastChat"></div>
            <input type="text" id="chatInput" placeholder="Chat with Cal & Arty..." style="width:100%; margin-top:10px;">
        </div>
    </div>
    
    <div class="grid">
        <div class="card">
            <h3>🎮 Debug Rooms</h3>
            <p>Private or public debugging sessions with AI support</p>
            <button onclick="showRoomCreator()">CREATE ROOM</button>
            <div id="activeRooms"></div>
        </div>
        
        <div class="card">
            <h3>📚 Upload Chat Logs</h3>
            <p>Train the AI with your debugging history</p>
            <div class="chat-upload">
                <p>Drag & drop your chat logs or paste below</p>
                <textarea id="chatLogInput" rows="5" placeholder="Paste your chat logs here..."></textarea>
                <button onclick="uploadLogs()">UPLOAD & TRAIN AI</button>
            </div>
            <div id="uploadResult"></div>
        </div>
        
        <div class="card">
            <h3>🏆 Leaderboards</h3>
            <div id="leaderboards">
                <p>Top Vibe Contributors:</p>
                <ol id="topVibers"></ol>
            </div>
        </div>
    </div>
    
    <div id="roomCreator" style="display:none;" class="card">
        <h3>Create Your Vibe Room</h3>
        <input type="text" id="roomName" placeholder="Room name..." style="width:100%; margin:10px 0;">
        <select id="roomType" style="width:100%; padding:10px; margin:10px 0;">
            <option value="debug_therapy">Debug Therapy (Private, 1-on-1)</option>
            <option value="chaos_coding">Chaos Coding Arena (Public mayhem)</option>
            <option value="soul_support">Soul Support Circle (Group therapy)</option>
            <option value="vibe_check">Vibe Check Lounge (Chill zone)</option>
        </select>
        <label>
            <input type="checkbox" id="privateRoom"> Private Room
        </label>
        <input type="password" id="roomPassword" placeholder="Room password (if private)" style="width:100%; margin:10px 0; display:none;">
        <button onclick="createRoom()">CREATE ROOM</button>
    </div>
</div>

<script>
let vibecastActive = false;
let vibecastInterval = null;

async function startVibecast() {
    const response = await fetch('/api/vibecast/start', {method: 'POST'});
    const data = await response.json();
    
    if (data.status === 'live') {
        vibecastActive = true;
        document.getElementById('vibecastSection').classList.add('live');
        document.getElementById('vibecastStatus').style.display = 'none';
        document.getElementById('vibecastContent').style.display = 'block';
        document.getElementById('vibecastTopic').textContent = data.topic;
        
        // Start polling for updates
        vibecastInterval = setInterval(updateVibecast, 2000);
    }
}

async function updateVibecast() {
    const response = await fetch('/api/vibecast/updates');
    const data = await response.json();
    
    const chatDiv = document.getElementById('vibecastChat');
    
    // Add new segments
    data.new_segments.forEach(segment => {
        if (segment.cal) {
            chatDiv.innerHTML += `<div class="cal-message"><strong>Cal:</strong> ${segment.cal}</div>`;
        }
        if (segment.arty) {
            chatDiv.innerHTML += `<div class="arty-message"><strong>Arty:</strong> ${segment.arty}</div>`;
        }
    });
    
    // Auto-scroll
    chatDiv.scrollTop = chatDiv.scrollHeight;
    
    // Update viewer count
    document.getElementById('liveViewers').textContent = data.viewers;
}

async function uploadLogs() {
    const logs = document.getElementById('chatLogInput').value;
    if (!logs.trim()) return;
    
    // Parse logs (simple format for now)
    const logArray = logs.split('\\n').map(line => ({message: line}));
    
    const response = await fetch('/api/upload-logs', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            logs: logArray,
            user_id: 'user_' + Date.now()
        })
    });
    
    const result = await response.json();
    
    document.getElementById('uploadResult').innerHTML = `
        <div style="background: rgba(0,255,0,0.2); padding: 15px; border-radius: 10px; margin-top: 10px;">
            <strong>Upload Complete!</strong><br>
            Processed: ${result.processed} messages<br>
            Insights gained: ${result.insights_gained.length}<br>
            Vibe boost: +${result.vibe_boost} points!
        </div>
    `;
    
    // Clear input
    document.getElementById('chatLogInput').value = '';
    
    // Update metrics
    updateMetrics();
}

function showRoomCreator() {
    document.getElementById('roomCreator').style.display = 'block';
}

document.getElementById('privateRoom').addEventListener('change', (e) => {
    document.getElementById('roomPassword').style.display = e.target.checked ? 'block' : 'none';
});

async function createRoom() {
    const roomData = {
        name: document.getElementById('roomName').value,
        type: document.getElementById('roomType').value,
        private: document.getElementById('privateRoom').checked,
        password: document.getElementById('roomPassword').value
    };
    
    const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(roomData)
    });
    
    const room = await response.json();
    
    // Hide creator
    document.getElementById('roomCreator').style.display = 'none';
    
    // Update room list
    loadRooms();
}

async function loadRooms() {
    const response = await fetch('/api/rooms');
    const rooms = await response.json();
    
    const roomsHtml = rooms.map(room => `
        <div class="room" onclick="joinRoom('${room.id}')">
            <strong>${room.name}</strong><br>
            Type: ${room.type}<br>
            Participants: ${room.participants.length}/${room.config.max_participants}<br>
            ${room.private ? '🔒 Private' : '🌍 Public'}
        </div>
    `).join('');
    
    document.getElementById('activeRooms').innerHTML = roomsHtml;
    document.getElementById('activeRooms').textContent = rooms.length;
}

async function joinRoom(roomId) {
    // In production, this would open the room interface
    alert(`Joining room ${roomId}...`);
}

async function updateMetrics() {
    const response = await fetch('/api/metrics');
    const metrics = await response.json();
    
    document.getElementById('totalVibes').textContent = metrics.total_vibes;
    document.getElementById('problemsSolved').textContent = metrics.problems_solved;
}

// Chat input for vibecast
document.getElementById('chatInput').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const message = e.target.value;
        if (!message.trim()) return;
        
        // Send to vibecast
        await fetch('/api/vibecast/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message})
        });
        
        e.target.value = '';
    }
});

// Initial load
updateMetrics();
loadRooms();

// Auto-refresh
setInterval(() => {
    updateMetrics();
    loadRooms();
}, 10000);
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path == '/api/metrics':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(platform.vibe_metrics).encode())
            
        elif self.path == '/api/rooms':
            rooms = list(platform.active_rooms.values())
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(rooms).encode())
            
        elif self.path == '/api/vibecast/updates':
            # Get recent vibecast updates
            updates = {
                'new_segments': platform.vibecast['replay_buffer'][-5:],
                'viewers': platform.vibecast['viewers'],
                'active': platform.vibecast['active']
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(updates).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/upload-logs':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                result = platform.upload_chat_logs(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
        elif self.path == '/api/room/create':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                room = platform.create_room(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(room).encode())
                
        elif self.path == '/api/vibecast/start':
            result = platform.start_vibecast()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        elif self.path == '/api/vibecast/chat':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                platform.vibecast['chat'].append({
                    'user': 'viewer',
                    'message': data['message'],
                    'timestamp': datetime.now().isoformat()
                })
                platform.vibecast['viewers'] += random.randint(1, 5)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
                
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[VIBE] {format % args}")

httpd = socketserver.TCPServer(("", PORT), VibePlatformHandler)
httpd.allow_reuse_address = True

print(f"\nVIBE PLATFORM MAX: http://localhost:{PORT}")
print("\nThe ULTIMATE dev ecosystem with:")
print("- Cal & Arty's Live Vibecast (AI personalities commenting)")
print("- Private debug rooms with AI moderators")
print("- Chat log upload for AI training")
print("- Real-time learning from every interaction")
print("- Chaos coding arenas")
print("- Soul support circles")
print("\nFeatures:")
print("- Upload your chat logs to train the AI")
print("- Create private rooms for 1-on-1 debug therapy")
print("- Join public chaos coding sessions")
print("- Watch Cal & Arty vibecast about latest bugs")
print("- Track your vibe contributions")
print("\nThis is where debugging becomes entertainment!")
print("Where support becomes a game!")
print("Where AI learns from our collective suffering!")

httpd.serve_forever()