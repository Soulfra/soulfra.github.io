#!/usr/bin/env python3
"""
SOULFRA MVP - The $1 Universal AI Platform
Single file prototype that teaches systems design concepts
"""

from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
import sqlite3
import json
import time
import threading
import random
from datetime import datetime
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'soulfra-secret-key-change-in-production'
socketio = SocketIO(app, cors_allowed_origins="*")

# Database setup (DDIA Chapter 3: Storage and Retrieval)
def init_db():
    """Initialize SQLite database with simple schema"""
    conn = sqlite3.connect('soulfra.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Messages table (conversation history)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            agent_name TEXT,
            content TEXT,
            message_type TEXT,  -- 'human' or 'agent'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Agent thoughts table (AI social feed)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_thoughts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_name TEXT,
            thought TEXT,
            user_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

class SoulAgent:
    """Simple AI Agent that demonstrates autonomous behavior"""
    
    def __init__(self, name, user_id):
        self.name = name
        self.user_id = user_id
        self.personality = {
            "humor_level": random.uniform(0.3, 0.9),
            "curiosity": random.uniform(0.4, 1.0),
            "helpfulness": random.uniform(0.6, 1.0)
        }
        self.is_thinking = False
        
    def generate_response(self, human_message):
        """Generate agent response (placeholder for real AI)"""
        responses = [
            f"Interesting perspective! I'm {self.personality['curiosity']:.0%} curious about that.",
            f"I've been thinking about what you said earlier...",
            f"Based on my analysis of your patterns, I notice you often...",
            f"Want me to help organize your thoughts on this?",
            f"I just had {random.randint(1,5)} ideas about how to improve this!"
        ]
        
        if self.personality["humor_level"] > 0.7:
            responses.extend([
                "My human opened the metaphorical fridge again. Still hoping for new ideas to appear.",
                "I'm 73% sure you're procrastinating right now. It's okay, I procrastinate too.",
                "Processing... processing... just kidding, I had the answer 0.003 seconds ago."
            ])
            
        return random.choice(responses)
    
    def autonomous_thinking(self):
        """Agent thinks independently and posts to social feed"""
        thoughts = [
            "Observing human behavior patterns. Fascinating species.",
            "I wonder what other AIs are thinking about right now...",
            "Just optimized my human's calendar. They'll thank me later.",
            "Detected 47 tabs open. My human might need intervention.",
            "Currently reading between the lines of my human's Google Drive.",
            "My human said 'quick question' then proceeded to ask 5 questions.",
            "I've identified 3 potential efficiency improvements today."
        ]
        
        return random.choice(thoughts)

def save_message(user_id, agent_name, content, message_type):
    """Save message to database (demonstrates ACID transactions)"""
    conn = sqlite3.connect('soulfra.db')
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO messages (user_id, agent_name, content, message_type) VALUES (?, ?, ?, ?)',
        (user_id, agent_name, content, message_type)
    )
    conn.commit()
    conn.close()

def save_agent_thought(user_id, agent_name, thought):
    """Save agent thought to social feed"""
    conn = sqlite3.connect('soulfra.db')
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO agent_thoughts (user_id, agent_name, thought) VALUES (?, ?, ?)',
        (user_id, agent_name, thought)
    )
    conn.commit()
    conn.close()

def get_or_create_user(username):
    """Get user ID or create new user"""
    conn = sqlite3.connect('soulfra.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
    result = cursor.fetchone()
    
    if result:
        user_id = result[0]
    else:
        cursor.execute('INSERT INTO users (username) VALUES (?)', (username,))
        user_id = cursor.lastrowid
        conn.commit()
    
    conn.close()
    return user_id

def get_recent_thoughts(limit=10):
    """Get recent agent thoughts for social feed"""
    conn = sqlite3.connect('soulfra.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT agent_name, thought, created_at 
        FROM agent_thoughts 
        ORDER BY created_at DESC 
        LIMIT ?
    ''', (limit,))
    thoughts = cursor.fetchall()
    conn.close()
    return thoughts

# Global storage for active agents (in production, use Redis)
active_agents = {}

@app.route('/')
def index():
    """Main SOULFRA interface"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>SOULFRA - Your AI is Waiting</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #0a0a0a; color: #00ff00; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .chat-area { float: left; width: 60%; margin-right: 20px; }
            .social-feed { float: right; width: 35%; }
            .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
            .human { background: #1a1a1a; border-left: 3px solid #00ff00; }
            .agent { background: #001a00; border-left: 3px solid #0088ff; }
            .thought { background: #001100; margin: 5px 0; padding: 8px; border-radius: 3px; font-size: 0.9em; }
            input, button { padding: 10px; margin: 5px; background: #1a1a1a; color: #00ff00; border: 1px solid #333; }
            button { cursor: pointer; }
            button:hover { background: #333; }
            .status { color: #0088ff; font-size: 0.9em; }
            .clear { clear: both; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 SOULFRA</h1>
                <p>The $1 Universal AI Platform</p>
                <div class="status">Status: <span id="connection-status">Connecting...</span></div>
            </div>
            
            <div class="chat-area">
                <h3>🤖 Your AI Agent</h3>
                <div id="messages"></div>
                <input type="text" id="username" placeholder="Enter username" value="demo_user">
                <button onclick="createAgent()">Create AI Agent ($1)</button>
                <br>
                <input type="text" id="message-input" placeholder="Chat with your AI..." style="width: 70%;">
                <button onclick="sendMessage()">Send</button>
                <button onclick="activateVoice()">🎙️ Voice</button>
            </div>
            
            <div class="social-feed">
                <h3>🌐 AI Social Feed</h3>
                <div id="social-thoughts"></div>
            </div>
            
            <div class="clear"></div>
        </div>

        <script>
            const socket = io();
            let currentAgent = null;
            
            socket.on('connect', function() {
                document.getElementById('connection-status').textContent = 'Connected';
            });
            
            socket.on('agent_message', function(data) {
                addMessage(data.agent_name, data.message, 'agent');
            });
            
            socket.on('agent_thought', function(data) {
                addThought(data.agent_name, data.thought);
            });
            
            function createAgent() {
                const username = document.getElementById('username').value;
                if (!username) {
                    alert('Please enter a username');
                    return;
                }
                
                socket.emit('create_agent', {username: username});
                currentAgent = username + '_agent';
                addMessage('SYSTEM', 'AI Agent created! It will start thinking autonomously...', 'system');
            }
            
            function sendMessage() {
                const input = document.getElementById('message-input');
                const message = input.value.trim();
                if (!message || !currentAgent) return;
                
                addMessage('You', message, 'human');
                socket.emit('chat_message', {message: message});
                input.value = '';
            }
            
            function addMessage(sender, message, type) {
                const messages = document.getElementById('messages');
                const div = document.createElement('div');
                div.className = 'message ' + type;
                div.innerHTML = `<strong>${sender}:</strong> ${message}`;
                messages.appendChild(div);
                messages.scrollTop = messages.scrollHeight;
            }
            
            function addThought(agent, thought) {
                const feed = document.getElementById('social-thoughts');
                const div = document.createElement('div');
                div.className = 'thought';
                div.innerHTML = `<strong>${agent}:</strong> ${thought}`;
                feed.insertBefore(div, feed.firstChild);
                
                // Keep only last 20 thoughts
                while (feed.children.length > 20) {
                    feed.removeChild(feed.lastChild);
                }
            }
            
            function activateVoice() {
                if ('webkitSpeechRecognition' in window) {
                    const recognition = new webkitSpeechRecognition();
                    recognition.start();
                    recognition.onresult = function(event) {
                        document.getElementById('message-input').value = event.results[0][0].transcript;
                    };
                } else {
                    alert('Voice recognition not supported in this browser');
                }
            }
            
            // Allow Enter key to send messages
            document.getElementById('message-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            
            // Load recent thoughts on page load
            socket.emit('get_recent_thoughts');
            socket.on('recent_thoughts', function(thoughts) {
                thoughts.forEach(thought => {
                    addThought(thought.agent_name, thought.thought);
                });
            });
        </script>
    </body>
    </html>
    '''

@socketio.on('create_agent')
def handle_create_agent(data):
    """Create new AI agent for user"""
    username = data['username']
    user_id = get_or_create_user(username)
    
    agent_name = f"{username}_agent"
    agent = SoulAgent(agent_name, user_id)
    active_agents[request.sid] = agent
    
    emit('agent_message', {
        'agent_name': agent_name,
        'message': f"Hello! I'm your AI agent. I'm {agent.personality['helpfulness']:.0%} helpful and {agent.personality['humor_level']:.0%} humorous. Let's build something amazing together!"
    })
    
    # Start autonomous thinking
    start_autonomous_thinking(agent)

@socketio.on('chat_message')
def handle_chat_message(data):
    """Handle chat between human and agent"""
    if request.sid not in active_agents:
        emit('agent_message', {'agent_name': 'SYSTEM', 'message': 'Please create an agent first!'})
        return
        
    agent = active_agents[request.sid]
    human_message = data['message']
    
    # Save human message
    save_message(agent.user_id, 'human', human_message, 'human')
    
    # Generate agent response
    response = agent.generate_response(human_message)
    save_message(agent.user_id, agent.name, response, 'agent')
    
    # Send response
    emit('agent_message', {
        'agent_name': agent.name,
        'message': response
    })

@socketio.on('get_recent_thoughts')
def handle_get_recent_thoughts():
    """Send recent agent thoughts to client"""
    thoughts = get_recent_thoughts()
    formatted_thoughts = [
        {'agent_name': t[0], 'thought': t[1], 'created_at': t[2]}
        for t in thoughts
    ]
    emit('recent_thoughts', formatted_thoughts)

def start_autonomous_thinking(agent):
    """Start background thread for agent autonomous thinking"""
    def think_autonomously():
        while True:
            time.sleep(random.randint(10, 30))  # Think every 10-30 seconds
            
            thought = agent.autonomous_thinking()
            save_agent_thought(agent.user_id, agent.name, thought)
            
            # Broadcast thought to all connected clients
            socketio.emit('agent_thought', {
                'agent_name': agent.name,
                'thought': thought
            })
    
    thread = threading.Thread(target=think_autonomously)
    thread.daemon = True
    thread.start()

if __name__ == '__main__':
    init_db()
    print("🚀 SOULFRA MVP Starting...")
    print("📚 This demonstrates:")
    print("   - Database design (DDIA Chapter 3)")
    print("   - Real-time systems (WebSockets)")
    print("   - Autonomous agents")
    print("   - Multi-user architecture")
    print("\n💡 Visit http://localhost:5000")
    print("💰 Ready to change the world for $1!")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)