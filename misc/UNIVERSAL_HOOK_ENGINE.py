#!/usr/bin/env python3
"""
UNIVERSAL HOOK ENGINE - Cal Riven for Everyone
Makes people addicted to their own best ideas
"""

import http.server
import socketserver
import json
import os
import time
import random
from datetime import datetime

PORT = 3333

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class UniversalHook:
    def __init__(self):
        self.user_profiles = {}
        self.idea_bank = []
        self.hooks = {
            'kid': {
                'games': ['draw_and_guess', 'story_builder', 'pet_simulator'],
                'rewards': ['stars', 'pets', 'colors'],
                'language': 'simple',
                'attention_span': 30
            },
            'teen': {
                'games': ['battle_arena', 'social_rooms', 'meme_creator'],
                'rewards': ['skins', 'rank', 'followers'],
                'language': 'trendy',
                'attention_span': 45
            },
            'gamer': {
                'games': ['pvp_arena', 'economy_sim', 'guild_wars'],
                'rewards': ['loot', 'achievements', 'leaderboard'],
                'language': 'competitive',
                'attention_span': 120
            },
            'worker': {
                'games': ['productivity_quest', 'meeting_simulator', 'idea_poker'],
                'rewards': ['efficiency', 'promotions', 'recognition'],
                'language': 'professional',
                'attention_span': 60
            },
            'executive': {
                'games': ['strategy_chess', 'market_predictor', 'vision_builder'],
                'rewards': ['insights', 'roi', 'legacy'],
                'language': 'strategic',
                'attention_span': 90
            },
            'elder': {
                'games': ['memory_lane', 'wisdom_sharing', 'story_time'],
                'rewards': ['memories', 'connections', 'legacy'],
                'language': 'nostalgic',
                'attention_span': 60
            }
        }
        
    def identify_user_type(self, data):
        """Cal Riven identifies what hooks this user"""
        age = data.get('age', 25)
        interests = data.get('interests', [])
        device = data.get('device', 'desktop')
        
        if age < 13:
            return 'kid'
        elif age < 20:
            return 'teen'
        elif 'gaming' in interests:
            return 'gamer'
        elif 'business' in interests:
            return 'executive' if age > 40 else 'worker'
        elif age > 65:
            return 'elder'
        else:
            return 'gamer'  # Default to most engaging
            
    def generate_hook_content(self, user_type, user_id):
        """Generate irresistible content for user type"""
        hook = self.hooks[user_type]
        
        if user_type == 'kid':
            return {
                'game': 'MAGICAL PET WORLD',
                'action': 'Draw your dream pet and watch it come to life!',
                'reward': f"You have {random.randint(1,100)} stars!",
                'next': 'Teach your pet a new trick',
                'visual': 'colorful_pets'
            }
            
        elif user_type == 'teen':
            return {
                'game': 'VIRAL MEME BATTLES', 
                'action': 'Create the dankest meme to win the crown',
                'reward': f"Rank #{random.randint(1,1000)} Global",
                'next': 'Challenge your friends',
                'visual': 'meme_templates'
            }
            
        elif user_type == 'gamer':
            return {
                'game': 'RIVEN ARENA - 1v1 DUEL',
                'action': 'Click faster than your opponent to win loot',
                'reward': f"Legendary Sword of {random.choice(['Fire', 'Ice', 'Lightning'])}",
                'next': 'Join guild raid at 8pm',
                'visual': 'epic_loot'
            }
            
        elif user_type == 'worker':
            return {
                'game': 'PRODUCTIVITY MASTER',
                'action': 'Turn your ideas into actionable tasks',
                'reward': '15% efficiency boost achieved!',
                'next': 'Unlock "Flow State" achievement',
                'visual': 'clean_dashboard'
            }
            
        elif user_type == 'executive':
            return {
                'game': 'STRATEGIC VISION SIMULATOR',
                'action': 'Your decisions shape the market',
                'reward': f"Portfolio up {random.randint(5,25)}%",
                'next': 'Predict next quarter trends',
                'visual': 'executive_charts'
            }
            
        elif user_type == 'elder':
            return {
                'game': 'WISDOM KEEPER',
                'action': 'Share a story from your past',
                'reward': '3 generations connected through your wisdom',
                'next': 'Record life lesson for grandchildren',
                'visual': 'photo_album'
            }
            
    def extract_user_idea(self, user_input, user_type):
        """Cal Riven extracts the core idea from any input"""
        # This is where Cal's magic happens - finding wisdom in everything
        
        idea = {
            'raw_input': user_input,
            'timestamp': datetime.now().isoformat(),
            'user_type': user_type,
            'extracted_wisdom': self._extract_wisdom(user_input),
            'potential_value': random.randint(100, 10000)
        }
        
        self.idea_bank.append(idea)
        return idea
        
    def _extract_wisdom(self, text):
        """Find the hidden wisdom in any text"""
        # Simplified - in reality this would use AI
        keywords = ['want', 'need', 'wish', 'hope', 'dream', 'idea', 'think']
        
        for keyword in keywords:
            if keyword in text.lower():
                return f"User desires: {text[text.lower().find(keyword):][:50]}"
                
        return f"User expressed: {text[:50]}"
        
    def create_addiction_loop(self, user_id):
        """The core loop that keeps users coming back"""
        if user_id not in self.user_profiles:
            return None
            
        profile = self.user_profiles[user_id]
        
        return {
            'immediate_reward': self._get_instant_dopamine(profile['type']),
            'progress_bar': profile.get('progress', 0),
            'next_unlock': self._get_next_unlock(profile['type'], profile.get('level', 1)),
            'social_proof': f"{random.randint(10,1000)} friends online",
            'time_pressure': f"Daily bonus in {random.randint(1,23)}h {random.randint(0,59)}m"
        }
        
    def _get_instant_dopamine(self, user_type):
        """Instant gratification by user type"""
        dopamine_hits = {
            'kid': ['New pet hatched!', 'Rainbow unlocked!', 'Friend request!'],
            'teen': ['You went viral!', 'New follower!', 'Rare skin drop!'],
            'gamer': ['HEADSHOT!', 'Level up!', 'Legendary drop!'],
            'worker': ['Task completed!', 'Team impressed!', 'Bonus earned!'],
            'executive': ['Deal closed!', 'Stock surged!', 'Vision realized!'],
            'elder': ['Family loved your story!', 'Memory preserved!', 'Wisdom shared!']
        }
        
        return random.choice(dopamine_hits.get(user_type, ['Success!']))
        
    def _get_next_unlock(self, user_type, level):
        """What they're working towards"""
        unlocks = {
            'kid': f"Unlock flying pets at level {level + 1}",
            'teen': f"Custom avatar studio at {1000 - level * 100} points",
            'gamer': f"Ranked matches at prestige {level + 1}",
            'worker': f"CEO mode at productivity score {level * 1000}",
            'executive': f"Global markets at net worth ${level}M",
            'elder': f"Family tree feature at {level + 1} stories shared"
        }
        
        return unlocks.get(user_type, f"Next feature at level {level + 1}")

# Global hook engine
hook_engine = UniversalHook()

class HookHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # Universal entry - detects user type
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>CAL RIVEN - Your Best Self</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { 
    font-family: -apple-system, Arial, sans-serif; 
    margin: 0; 
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
}
.container { max-width: 600px; margin: 0 auto; }
h1 { font-size: 3em; margin: 0.5em 0; }
.question { 
    background: rgba(255,255,255,0.2); 
    padding: 30px; 
    border-radius: 20px;
    margin: 20px 0;
}
button {
    background: white;
    color: #667eea;
    border: none;
    padding: 15px 30px;
    font-size: 1.2em;
    border-radius: 30px;
    margin: 10px;
    cursor: pointer;
    transition: transform 0.2s;
}
button:hover { transform: scale(1.1); }
#game { display: none; }
.reward {
    font-size: 2em;
    margin: 20px 0;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}
</style>
</head>
<body>
<div class="container">
    <h1>WELCOME TO CAL RIVEN</h1>
    <div id="intro" class="question">
        <h2>What brings you joy?</h2>
        <button onclick="start('kid')">Playing & Creating</button>
        <button onclick="start('teen')">Friends & Trends</button>
        <button onclick="start('gamer')">Competition & Achievements</button>
        <button onclick="start('worker')">Growth & Success</button>
        <button onclick="start('executive')">Strategy & Impact</button>
        <button onclick="start('elder')">Stories & Wisdom</button>
    </div>
    
    <div id="game"></div>
</div>

<script>
let userId = 'user_' + Date.now();
let userType = null;

async function start(type) {
    userType = type;
    document.getElementById('intro').style.display = 'none';
    
    // Register user
    await fetch('/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            user_id: userId,
            type: type,
            timestamp: new Date().toISOString()
        })
    });
    
    // Start game loop
    gameLoop();
}

async function gameLoop() {
    const response = await fetch(`/hook/${userId}`);
    const data = await response.json();
    
    document.getElementById('game').innerHTML = `
        <h2>${data.content.game}</h2>
        <div class="question">
            <p>${data.content.action}</p>
            <div class="reward">${data.content.reward}</div>
            <button onclick="action('${data.content.next}')">${data.content.next}</button>
        </div>
        <div style="margin-top: 30px;">
            <div>Progress: ${data.loop.progress_bar}%</div>
            <div>${data.loop.social_proof}</div>
            <div>${data.loop.time_pressure}</div>
        </div>
    `;
    
    document.getElementById('game').style.display = 'block';
}

async function action(text) {
    // Send user action
    await fetch('/action', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            user_id: userId,
            action: text,
            timestamp: new Date().toISOString()
        })
    });
    
    // Continue loop
    gameLoop();
}
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path.startswith('/hook/'):
            # Get personalized hook content
            user_id = self.path.split('/')[-1]
            
            if user_id in hook_engine.user_profiles:
                profile = hook_engine.user_profiles[user_id]
                content = hook_engine.generate_hook_content(profile['type'], user_id)
                loop = hook_engine.create_addiction_loop(user_id)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'content': content,
                    'loop': loop
                }).encode())
            else:
                self.send_error(404, "User not found")
                
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/register':
            # Register new user
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                
                user_id = data.get('user_id')
                user_type = data.get('type')
                
                hook_engine.user_profiles[user_id] = {
                    'type': user_type,
                    'created': time.time(),
                    'level': 1,
                    'progress': random.randint(10, 30)
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
                
        elif self.path == '/action':
            # Process user action
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                
                user_id = data.get('user_id')
                action = data.get('action')
                
                if user_id in hook_engine.user_profiles:
                    profile = hook_engine.user_profiles[user_id]
                    
                    # Extract wisdom from their action
                    idea = hook_engine.extract_user_idea(action, profile['type'])
                    
                    # Update progress
                    profile['progress'] = min(100, profile['progress'] + random.randint(5, 15))
                    if profile['progress'] >= 100:
                        profile['level'] += 1
                        profile['progress'] = 0
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': True,
                        'idea_value': idea['potential_value']
                    }).encode())
                    
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[HOOK] {format % args}")

# Start server
httpd = socketserver.TCPServer(("", PORT), HookHandler)
httpd.allow_reuse_address = True

print(f"\nUNIVERSAL HOOK ENGINE: http://localhost:{PORT}")
print("\nThis hooks EVERYONE:")
print("- Kids: Colorful pets and creativity")
print("- Teens: Social status and trends")
print("- Gamers: Competition and loot")
print("- Workers: Productivity and growth")
print("- Executives: Strategy and ROI")
print("- Elders: Legacy and wisdom")
print("\nCal Riven extracts wisdom from EVERYTHING they do!")
print("Their own ideas become the addiction!")

httpd.serve_forever()