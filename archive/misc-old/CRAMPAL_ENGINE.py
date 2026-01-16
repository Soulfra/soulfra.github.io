from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
CRAMPAL.COM - The Education Research Platform That Actually Works
Where students become teachers and everyone debugs together
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

PORT = 7000

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class CramPalEngine:
    def __init__(self):
        # Core systems
        self.users = {}
        self.study_sessions = {}
        self.knowledge_base = defaultdict(list)
        self.campus_networks = {}
        
        # Narrators (Cal & Arty style but for studying)
        self.narrators = {
            'professor_pal': {
                'style': 'wise and encouraging',
                'quotes': [
                    "Every error is a lesson waiting to be learned",
                    "Your confusion is the first step to mastery",
                    "Let's break this down together"
                ]
            },
            'chaos_cram': {
                'style': 'energetic and fun',
                'quotes': [
                    "YOOO this problem is actually wild!",
                    "Let's speedrun this assignment!",
                    "Who needs sleep when you have knowledge!"
                ]
            }
        }
        
        # Study room types
        self.room_types = {
            'debug_den': 'Code debugging with live help',
            'cram_cave': 'Last minute study sessions',
            'concept_clinic': 'Deep understanding workshops',
            'project_pit': 'Group project coordination'
        }
        
        # Metrics
        self.platform_stats = {
            'problems_solved': 0,
            'concepts_mastered': 0,
            'students_helped': 0,
            'campuses_active': 0,
            'knowledge_shared': 0
        }
        
        # Start background threads
        threading.Thread(target=self._narrator_engine, daemon=True).start()
        threading.Thread(target=self._match_helper_engine, daemon=True).start()
        
    def create_study_session(self, data):
        """Create a new study/debug session"""
        session_id = hashlib.md5(f"{data['topic']}{time.time()}".encode()).hexdigest()[:8]
        
        session = {
            'id': session_id,
            'topic': data['topic'],
            'type': data.get('type', 'general'),
            'difficulty': self._assess_difficulty(data['topic']),
            'creator': data['user_id'],
            'helpers': [],
            'messages': [],
            'status': 'open',
            'created': datetime.now().isoformat(),
            'narrator_active': True,
            'solution_found': False
        }
        
        self.study_sessions[session_id] = session
        
        # Generate narrator intro
        intro = self._generate_narrator_intro(session)
        session['messages'].append(intro)
        
        return session
        
    def _assess_difficulty(self, topic):
        """Assess topic difficulty"""
        topic_lower = topic.lower()
        
        if any(word in topic_lower for word in ['algorithm', 'recursion', 'optimization']):
            return 'hard'
        elif any(word in topic_lower for word in ['loop', 'function', 'array']):
            return 'medium'
        else:
            return 'easy'
            
    def _generate_narrator_intro(self, session):
        """Generate narrator introduction for session"""
        if session['difficulty'] == 'hard':
            prof_msg = "Ah, a challenging topic! Fear not, we'll conquer this together."
            chaos_msg = "OH SNAP, we're going DEEP today! Let's GOOO!"
        else:
            prof_msg = "Excellent topic choice. Let's build your understanding step by step."
            chaos_msg = "Easy mode activated! We'll crush this in no time!"
            
        return {
            'type': 'narrator',
            'professor_pal': prof_msg,
            'chaos_cram': chaos_msg,
            'timestamp': datetime.now().isoformat()
        }
        
    def submit_help(self, session_id, helper_data):
        """Helper submits solution/explanation"""
        if session_id not in self.study_sessions:
            return None
            
        session = self.study_sessions[session_id]
        
        # Analyze help quality
        quality = self._analyze_help_quality(helper_data['message'], session['topic'])
        
        # Add to session
        help_entry = {
            'helper_id': helper_data['helper_id'],
            'message': helper_data['message'],
            'quality_score': quality['score'],
            'explanation_clarity': quality['clarity'],
            'timestamp': datetime.now().isoformat()
        }
        
        session['messages'].append(help_entry)
        session['helpers'].append(helper_data['helper_id'])
        
        # Update helper stats
        if helper_data['helper_id'] in self.users:
            user = self.users[helper_data['helper_id']]
            user['problems_helped'] += 1
            user['xp'] += quality['score']
            
        # Check if solved
        if quality['score'] > 80:
            session['solution_found'] = True
            session['status'] = 'solved'
            self.platform_stats['problems_solved'] += 1
            
        # Generate narrator response
        narrator_response = self._generate_narrator_feedback(quality, session)
        session['messages'].append(narrator_response)
        
        return {
            'quality': quality,
            'xp_earned': quality['score'],
            'narrator_feedback': narrator_response
        }
        
    def _analyze_help_quality(self, message, topic):
        """Analyze how good the help is"""
        score = 50  # Base score
        
        # Check for explanation
        if any(word in message.lower() for word in ['because', 'since', 'therefore']):
            score += 20
            
        # Check for examples
        if any(word in message.lower() for word in ['example', 'for instance', 'like']):
            score += 15
            
        # Check for step-by-step
        if any(word in message.lower() for word in ['first', 'then', 'finally', 'step']):
            score += 15
            
        # Length check
        word_count = len(message.split())
        if 30 < word_count < 200:
            clarity = 'clear'
        elif word_count <= 30:
            clarity = 'too brief'
        else:
            clarity = 'too long'
            
        return {
            'score': min(100, score),
            'clarity': clarity,
            'has_examples': 'example' in message.lower(),
            'has_steps': 'step' in message.lower()
        }
        
    def _generate_narrator_feedback(self, quality, session):
        """Narrators comment on the help given"""
        score = quality['score']
        
        if score > 80:
            prof = "Excellent explanation! This is exactly the kind of help that builds understanding."
            chaos = "YESSS! That explanation was FIRE! Problem = DESTROYED!"
        elif score > 60:
            prof = "Good effort! Perhaps adding an example would make it even clearer."
            chaos = "Pretty solid! Could use more ENERGY but it works!"
        else:
            prof = "A start, but let's see if we can explain it more clearly."
            chaos = "Hmm, needs more sauce! Who else wants to take a shot?"
            
        return {
            'type': 'narrator_feedback',
            'professor_pal': prof,
            'chaos_cram': chaos,
            'timestamp': datetime.now().isoformat()
        }
        
    def create_campus_network(self, campus_data):
        """Create a campus-specific network"""
        campus_id = hashlib.md5(campus_data['name'].encode()).hexdigest()[:8]
        
        self.campus_networks[campus_id] = {
            'name': campus_data['name'],
            'members': [],
            'active_sessions': 0,
            'problems_solved': 0,
            'top_helpers': [],
            'created': datetime.now().isoformat()
        }
        
        self.platform_stats['campuses_active'] += 1
        
        return campus_id
        
    def _narrator_engine(self):
        """Background thread for narrator commentary"""
        while True:
            # Check active sessions
            for session_id, session in self.study_sessions.items():
                if session['narrator_active'] and session['status'] == 'open':
                    # Random chance of narrator interjection
                    if random.random() < 0.1:  # 10% chance
                        comment = self._generate_random_narrator_comment(session)
                        session['messages'].append(comment)
                        
            time.sleep(30)  # Check every 30 seconds
            
    def _generate_random_narrator_comment(self, session):
        """Generate random helpful narrator comment"""
        comments = {
            'professor_pal': [
                "Remember, breaking the problem into smaller parts often helps.",
                "Don't hesitate to share your thought process, even if incomplete.",
                "Every expert was once a beginner. Keep going!"
            ],
            'chaos_cram': [
                "Someone drop some knowledge bombs in here!",
                "This problem won't solve itself - LET'S GO TEAM!",
                "I believe in you random internet stranger!"
            ]
        }
        
        return {
            'type': 'narrator_comment',
            'professor_pal': random.choice(comments['professor_pal']),
            'chaos_cram': random.choice(comments['chaos_cram']),
            'timestamp': datetime.now().isoformat()
        }
        
    def _match_helper_engine(self):
        """Match helpers with students who need help"""
        while True:
            # Find open sessions and available helpers
            open_sessions = [s for s in self.study_sessions.values() if s['status'] == 'open']
            
            # In production, this would do smart matching based on expertise
            # For now, just track metrics
            self.platform_stats['knowledge_shared'] = len(self.study_sessions)
            
            time.sleep(10)

# Global engine
crampal = CramPalEngine()

class CramPalHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>CramPal - Where Learning Gets Real</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: -apple-system, sans-serif;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    color: #fff;
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.logo {
    text-align: center;
    font-size: 4em;
    font-weight: bold;
    background: linear-gradient(45deg, #f39c12, #e74c3c, #9b59b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 20px 0;
}

.tagline {
    text-align: center;
    font-size: 1.3em;
    opacity: 0.8;
    margin-bottom: 40px;
}

.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 30px 0;
}

.stat-card {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 20px;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.2);
}

.stat-value {
    font-size: 2.5em;
    color: #f39c12;
    font-weight: bold;
}

.stat-label {
    opacity: 0.7;
    margin-top: 5px;
}

.main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin: 40px 0;
}

.section {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(5px);
    border-radius: 20px;
    padding: 30px;
    border: 1px solid rgba(255,255,255,0.1);
}

.btn {
    background: linear-gradient(45deg, #f39c12, #e74c3c);
    color: white;
    border: none;
    padding: 15px 30px;
    font-size: 1.1em;
    font-weight: bold;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s;
    display: inline-block;
    text-decoration: none;
    margin: 10px 0;
}

.btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(243,156,18,0.4);
}

.session-card {
    background: rgba(255,255,255,0.05);
    border-radius: 15px;
    padding: 20px;
    margin: 15px 0;
    border-left: 4px solid #f39c12;
    cursor: pointer;
    transition: all 0.3s;
}

.session-card:hover {
    background: rgba(255,255,255,0.1);
    transform: translateX(5px);
}

.difficulty-hard { border-left-color: #e74c3c; }
.difficulty-medium { border-left-color: #f39c12; }
.difficulty-easy { border-left-color: #2ecc71; }

.narrator-box {
    background: linear-gradient(135deg, rgba(155,89,182,0.2), rgba(52,152,219,0.2));
    border-radius: 15px;
    padding: 20px;
    margin: 20px 0;
    border: 1px solid rgba(155,89,182,0.5);
}

.narrator-prof {
    color: #3498db;
    font-style: italic;
    margin: 10px 0;
}

.narrator-chaos {
    color: #e74c3c;
    font-weight: bold;
    margin: 10px 0;
}

input, textarea, select {
    width: 100%;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 15px;
    border-radius: 10px;
    font-size: 1em;
    margin: 10px 0;
}

input::placeholder, textarea::placeholder {
    color: rgba(255,255,255,0.5);
}

.campus-badge {
    display: inline-block;
    background: #9b59b6;
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.9em;
    margin: 5px;
}

.live-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #2ecc71;
    border-radius: 50%;
    margin-right: 10px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.chat-box {
    background: rgba(0,0,0,0.3);
    border-radius: 10px;
    padding: 20px;
    height: 400px;
    overflow-y: auto;
    margin: 20px 0;
}

.message {
    margin: 10px 0;
    padding: 10px;
    border-radius: 10px;
    background: rgba(255,255,255,0.05);
}

.message.narrator {
    background: linear-gradient(135deg, rgba(155,89,182,0.1), rgba(52,152,219,0.1));
    border: 1px solid rgba(155,89,182,0.3);
}

.helper-tag {
    display: inline-block;
    background: #2ecc71;
    color: white;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 0.8em;
    margin-right: 10px;
}
</style>
</head>
<body>
<div class="container">
    <h1 class="logo">CramPal</h1>
    <p class="tagline">Where Students Become Teachers & Everyone Debugs Together</p>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-value" id="problemsSolved">0</div>
            <div class="stat-label">Problems Solved</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="studentsHelped">0</div>
            <div class="stat-label">Students Helped</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="campusesActive">0</div>
            <div class="stat-label">Campuses Active</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="liveNow">0</div>
            <div class="stat-label">Live Sessions</div>
        </div>
    </div>
    
    <div class="narrator-box">
        <div class="narrator-prof">Professor Pal: "Welcome to CramPal! Every question is an opportunity to learn together."</div>
        <div class="narrator-chaos">Chaos Cram: "LET'S GOOO! Time to turn confusion into KNOWLEDGE!"</div>
    </div>
    
    <div class="main-grid">
        <div class="section">
            <h2>Need Help? Start a Session</h2>
            <input type="text" id="topicInput" placeholder="What are you stuck on? (e.g., 'recursive functions', 'CSS flexbox', 'calculus derivatives')">
            <select id="sessionType">
                <option value="debug_den">Debug Den - Code problems</option>
                <option value="cram_cave">Cram Cave - Quick study session</option>
                <option value="concept_clinic">Concept Clinic - Deep understanding</option>
                <option value="project_pit">Project Pit - Group work</option>
            </select>
            <button class="btn" onclick="createSession()">START SESSION</button>
            
            <h3 style="margin-top: 30px;">Join Your Campus</h3>
            <input type="text" id="campusName" placeholder="Your university name...">
            <button class="btn" onclick="joinCampus()">JOIN CAMPUS NETWORK</button>
        </div>
        
        <div class="section">
            <h2><span class="live-indicator"></span>Live Study Sessions</h2>
            <div id="liveSessions">
                <!-- Sessions load here -->
            </div>
        </div>
    </div>
    
    <div id="sessionView" style="display:none;" class="section">
        <h2 id="sessionTitle"></h2>
        <div class="chat-box" id="chatBox"></div>
        <textarea id="helpInput" rows="3" placeholder="Share your explanation or solution..."></textarea>
        <button class="btn" onclick="submitHelp()">HELP THIS STUDENT</button>
    </div>
</div>

<script>
let currentSession = null;
let userId = 'user_' + Date.now();

async function createSession() {
    const topic = document.getElementById('topicInput').value.trim();
    const type = document.getElementById('sessionType').value;
    
    if (!topic) return;
    
    const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            topic: topic,
            type: type,
            user_id: userId
        })
    });
    
    const session = await response.json();
    showSession(session);
}

function showSession(session) {
    currentSession = session;
    document.getElementById('sessionView').style.display = 'block';
    document.getElementById('sessionTitle').textContent = session.topic;
    
    updateChat(session);
}

function updateChat(session) {
    const chatBox = document.getElementById('chatBox');
    let html = '';
    
    session.messages.forEach(msg => {
        if (msg.type === 'narrator' || msg.type === 'narrator_comment') {
            html += '<div class="message narrator">';
            html += '<div class="narrator-prof">Professor Pal: ' + msg.professor_pal + '</div>';
            html += '<div class="narrator-chaos">Chaos Cram: ' + msg.chaos_cram + '</div>';
            html += '</div>';
        } else if (msg.helper_id) {
            html += '<div class="message">';
            html += '<span class="helper-tag">Helper</span>';
            html += msg.message;
            html += '</div>';
        }
    });
    
    chatBox.innerHTML = html;
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function submitHelp() {
    const message = document.getElementById('helpInput').value.trim();
    if (!message || !currentSession) return;
    
    const response = await fetch('/api/help/submit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            session_id: currentSession.id,
            helper_id: userId,
            message: message
        })
    });
    
    const result = await response.json();
    
    // Clear input
    document.getElementById('helpInput').value = '';
    
    // Refresh session
    loadSession(currentSession.id);
}

async function loadSession(sessionId) {
    const response = await fetch('/api/session/' + sessionId);
    const session = await response.json();
    showSession(session);
}

async function loadLiveSessions() {
    const response = await fetch('/api/sessions/live');
    const sessions = await response.json();
    
    const html = sessions.map(session => `
        <div class="session-card difficulty-${session.difficulty}" onclick="loadSession('${session.id}')">
            <strong>${session.topic}</strong>
            <div style="font-size: 0.9em; opacity: 0.7;">
                ${session.type} | ${session.helpers.length} helpers | ${session.status}
            </div>
        </div>
    `).join('');
    
    document.getElementById('liveSessions').innerHTML = html || '<p style="opacity: 0.5;">No live sessions yet. Start one!</p>';
    document.getElementById('liveNow').textContent = sessions.length;
}

async function updateStats() {
    const response = await fetch('/api/stats');
    const stats = await response.json();
    
    document.getElementById('problemsSolved').textContent = stats.problems_solved;
    document.getElementById('studentsHelped').textContent = stats.students_helped;
    document.getElementById('campusesActive').textContent = stats.campuses_active;
}

async function joinCampus() {
    const name = document.getElementById('campusName').value.trim();
    if (!name) return;
    
    const response = await fetch('/api/campus/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name})
    });
    
    const campusId = await response.json();
    alert('Joined campus network! ID: ' + campusId);
}

// Initial load
updateStats();
loadLiveSessions();

// Auto refresh
setInterval(() => {
    updateStats();
    loadLiveSessions();
    if (currentSession) {
        loadSession(currentSession.id);
    }
}, 5000);
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(crampal.platform_stats).encode())
            
        elif self.path == '/api/sessions/live':
            sessions = [s for s in crampal.study_sessions.values() if s['status'] == 'open']
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(sessions[:20]).encode())
            
        elif self.path.startswith('/api/session/'):
            session_id = self.path.split('/')[-1]
            if session_id in crampal.study_sessions:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(crampal.study_sessions[session_id]).encode())
            else:
                self.send_error(404)
                
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/session/create':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                session = crampal.create_study_session(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(session).encode())
                
        elif self.path == '/api/help/submit':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                result = crampal.submit_help(data['session_id'], data)
                
                if result:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(result).encode())
                else:
                    self.send_error(404)
                    
        elif self.path == '/api/campus/create':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                campus_id = crampal.create_campus_network(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(campus_id).encode())
                
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[CRAMPAL] {format % args}")

httpd = socketserver.TCPServer(("", PORT), CramPalHandler)
httpd.allow_reuse_address = True

print(f"\nCRAMPAL ENGINE: http://localhost:{PORT}")
print("\nThe Education Research Platform That Works!")
print("\nFeatures:")
print("- Live narrator commentary (Professor Pal & Chaos Cram)")
print("- Students help students (and get XP)")
print("- Campus-specific networks")
print("- Debug dens, cram caves, concept clinics")
print("- Real-time problem solving")
print("\nNo formatting errors - pure Python!")
print("\nThis is how we take over education:")
print("1. Students post their actual problems")
print("2. Other students compete to help")
print("3. Narrators keep it engaging")
print("4. Everyone learns by teaching")
print("5. Campuses join the network")
print("\nCramPal.com - Coming to a campus near you!")

httpd.serve_forever()